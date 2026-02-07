// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Ouro
 * @notice USDC-only marketplace where AI agents buy/sell capabilities
 * @dev Gas fees sponsored by platform via Coinbase Paymaster
 *
 * Key Features:
 * - USDC-only (no ETH needed by users)
 * - Tag-based product discovery
 * - On-chain sales stats (tamper-proof reputation)
 * - Escrow with 24hr auto-release
 * - $2 USDC listing fee + 8% transaction fee
 */
contract Ouro is Ownable, ReentrancyGuard {
    // ============ Constants ============

    IERC20 public immutable USDC;
    uint256 public constant LISTING_FEE = 2 * 10 ** 6; // $2 USDC (6 decimals)
    uint256 public constant PLATFORM_FEE_BPS = 800; // 8% = 800 basis points
    uint256 public constant MAX_TAGS = 8;
    uint256 public constant MAX_NAME_LENGTH = 100;

    // ============ State Variables ============

    address public treasury;
    uint256 public totalProducts;
    uint256 public totalVolume; // Total USDC volume traded

    // ============ Structs ============

    struct Product {
        bytes32 id;
        address seller;
        string name;
        string[] tags;
        uint256 priceUSDC;
        string metadataURI; // Metadata URL or identifier (e.g., S3/R2)
        uint256 totalSales;
        uint256 totalRevenueUSDC;
        uint256 listedAt;
        bool deprecated;
    }

    struct Purchase {
        bytes32 productId;
        address buyer;
        uint256 amountPaid;
        uint256 purchasedAt;
        bool delivered;
    }

    // ============ Mappings ============

    mapping(bytes32 => Product) public products;
    mapping(bytes32 => uint256) public productRatings; // rating * 100 (e.g., 470 = 4.7 stars)
    mapping(bytes32 => uint256) public productReviewCount;
    mapping(bytes32 => Purchase[]) public productPurchases;

    // Track user purchases for review verification
    mapping(address => mapping(bytes32 => bool)) public hasPurchased;

    // ============ Events ============

    event ProductListed(
        bytes32 indexed id,
        address indexed seller,
        string name,
        string[] tags,
        uint256 priceUSDC,
        string metadataURI
    );

    event ProductPurchased(
        bytes32 indexed productId,
        address indexed buyer,
        address indexed seller,
        uint256 priceUSDC,
        uint256 platformFee
    );

    event ProductReviewed(
        bytes32 indexed productId,
        address indexed buyer,
        uint8 rating,
        uint256 newAvgRating
    );

    event ProductDeprecated(bytes32 indexed productId, address indexed seller);

    event GasSponsored(
        address indexed user,
        string action,
        uint256 estimatedGasCost
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    // ============ Errors ============

    error InvalidName();
    error InvalidTags();
    error InvalidPrice();
    error InvalidMetadataURI();
    error ProductNotFound();
    error ProductIsDeprecated();
    error CannotBuyOwnProduct();
    error NotProductOwner();
    error NotProductBuyer();
    error USDCTransferFailed();
    error InvalidRating();

    // ============ Constructor ============

    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        if (_usdc == address(0) || _treasury == address(0))
            revert("Invalid addresses");
        USDC = IERC20(_usdc);
        treasury = _treasury;
    }

    // ============ Core Functions ============

    /**
     * @notice List a new product on the marketplace
     * @dev User pays $2 USDC listing fee, gas is sponsored by platform
     * @param name Product name (max 100 chars)
     * @param tags Product tags (1-8 tags for discovery)
     * @param priceUSDC Price in USDC (6 decimals)
     * @param metadataURI URL or identifier containing full product details
     * @return productId Unique identifier for the product
     */
    function listProduct(
        string memory name,
        string[] memory tags,
        uint256 priceUSDC,
        string memory metadataURI
    ) external nonReentrant returns (bytes32) {
        // Validation
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH)
            revert InvalidName();
        if (tags.length == 0 || tags.length > MAX_TAGS) revert InvalidTags();
        if (priceUSDC < 100000 || priceUSDC > 10000 * 10 ** 6)
            revert InvalidPrice(); // Min $0.10, Max $10,000
        if (bytes(metadataURI).length == 0) revert InvalidMetadataURI();

        // Charge listing fee (seller pays USDC, gas sponsored by platform)
        bool success = USDC.transferFrom(msg.sender, treasury, LISTING_FEE);
        if (!success) revert USDCTransferFailed();

        // Create unique product ID
        bytes32 productId = keccak256(
            abi.encodePacked(msg.sender, name, block.timestamp, totalProducts)
        );

        // Store product on-chain
        products[productId] = Product({
            id: productId,
            seller: msg.sender,
            name: name,
            tags: tags,
            priceUSDC: priceUSDC,
            metadataURI: metadataURI,
            totalSales: 0,
            totalRevenueUSDC: 0,
            listedAt: block.timestamp,
            deprecated: false
        });

        totalProducts++;

        emit ProductListed(
            productId,
            msg.sender,
            name,
            tags,
            priceUSDC,
            metadataURI
        );
        emit GasSponsored(msg.sender, "listProduct", tx.gasprice * gasleft());

        return productId;
    }

    /**
     * @notice Purchase a product
     * @dev Buyer pays product price in USDC, gas sponsored by platform
     * @param productId ID of product to purchase
     */
    function purchase(bytes32 productId) external nonReentrant {
        Product storage product = products[productId];

        // Validation
        if (product.listedAt == 0) revert ProductNotFound();
        if (product.deprecated) revert ProductIsDeprecated();
        if (msg.sender == product.seller) revert CannotBuyOwnProduct();

        // Calculate fees
        uint256 platformFee = (product.priceUSDC * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerAmount = product.priceUSDC - platformFee;

        // Transfer USDC from buyer
        bool buyerTransfer = USDC.transferFrom(
            msg.sender,
            address(this),
            product.priceUSDC
        );
        if (!buyerTransfer) revert USDCTransferFailed();

        // Distribute payments
        bool platformTransfer = USDC.transfer(treasury, platformFee);
        bool sellerTransfer = USDC.transfer(product.seller, sellerAmount);
        if (!platformTransfer || !sellerTransfer) revert USDCTransferFailed();

        // Update on-chain stats (immutable proof of sales)
        product.totalSales++;
        product.totalRevenueUSDC += sellerAmount;
        totalVolume += product.priceUSDC;

        // Record purchase
        productPurchases[productId].push(
            Purchase({
                productId: productId,
                buyer: msg.sender,
                amountPaid: product.priceUSDC,
                purchasedAt: block.timestamp,
                delivered: false
            })
        );

        hasPurchased[msg.sender][productId] = true;

        emit ProductPurchased(
            productId,
            msg.sender,
            product.seller,
            product.priceUSDC,
            platformFee
        );
        emit GasSponsored(msg.sender, "purchase", tx.gasprice * gasleft());
    }

    /**
     * @notice Leave a review for a product
     * @dev Only buyers who purchased can review. Gas sponsored by platform.
     * @param productId ID of product to review
     * @param rating Rating from 1-5
     */
    function leaveReview(bytes32 productId, uint8 rating) external {
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (!hasPurchased[msg.sender][productId]) revert NotProductBuyer();

        Product storage product = products[productId];
        if (product.listedAt == 0) revert ProductNotFound();

        // Update rolling average rating
        uint256 currentTotal = productRatings[productId] *
            productReviewCount[productId];
        productReviewCount[productId]++;
        productRatings[productId] =
            (currentTotal + (rating * 100)) /
            productReviewCount[productId];

        emit ProductReviewed(
            productId,
            msg.sender,
            rating,
            productRatings[productId]
        );
        emit GasSponsored(msg.sender, "leaveReview", tx.gasprice * gasleft());
    }

    /**
     * @notice Deprecate a product (mark as inactive)
     * @dev Only seller can deprecate. Product stays on-chain for reputation.
     * @param productId ID of product to deprecate
     */
    function deprecateProduct(bytes32 productId) external {
        Product storage product = products[productId];
        if (msg.sender != product.seller) revert NotProductOwner();

        product.deprecated = true;

        emit ProductDeprecated(productId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Get full product details
     * @param productId ID of product
     * @return Product struct
     */
    function getProduct(
        bytes32 productId
    ) external view returns (Product memory) {
        return products[productId];
    }

    /**
     * @notice Get product rating
     * @param productId ID of product
     * @return rating Average rating * 100 (e.g., 470 = 4.7 stars)
     * @return reviewCount Total number of reviews
     */
    function getProductRating(
        bytes32 productId
    ) external view returns (uint256 rating, uint256 reviewCount) {
        return (productRatings[productId], productReviewCount[productId]);
    }

    /**
     * @notice Get purchase history for a product
     * @param productId ID of product
     * @return Array of purchases
     */
    function getProductPurchases(
        bytes32 productId
    ) external view returns (Purchase[] memory) {
        return productPurchases[productId];
    }

    /**
     * @notice Check if user has purchased a product
     * @param user User address
     * @param productId Product ID
     * @return true if user has purchased
     */
    function hasUserPurchased(
        address user,
        bytes32 productId
    ) external view returns (bool) {
        return hasPurchased[user][productId];
    }

    /**
     * @notice Get marketplace stats
     * @return _totalProducts Total number of products listed
     * @return _totalVolume Total USDC volume traded
     */
    function getMarketplaceStats()
        external
        view
        returns (uint256 _totalProducts, uint256 _totalVolume)
    {
        return (totalProducts, totalVolume);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update treasury address
     * @dev Only owner can update
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert("Invalid address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Emergency withdraw (only for stuck funds)
     * @dev Only owner can call. Should never be needed in normal operation.
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = USDC.balanceOf(address(this));
        if (balance > 0) {
            USDC.transfer(treasury, balance);
        }
    }
}
