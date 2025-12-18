// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GameLeaderboard
 * @notice On-chain leaderboard for Neon Arena game scores
 * @dev Deployable on Moonbeam/Moonriver (Polkadot ecosystem) or Astar
 */
contract GameLeaderboard {
    
    // ============ State Variables ============
    
    address public owner;
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    uint256 public weeklyPrizePool;
    uint256 public currentWeekStart;
    uint256 public constant WEEK_DURATION = 7 days;
    
    struct PlayerScore {
        address player;
        uint256 score;
        uint256 timestamp;
        string gameType;
    }
    
    struct PlayerStats {
        uint256 highScore;
        uint256 totalGamesPlayed;
        uint256 totalScore;
        uint256 lastPlayed;
        bool isRegistered;
    }
    
    // All-time leaderboard
    PlayerScore[] public allTimeLeaderboard;
    
    // Weekly leaderboard
    PlayerScore[] public weeklyLeaderboard;
    
    // Player stats mapping
    mapping(address => PlayerStats) public playerStats;
    
    // Registered players list
    address[] public registeredPlayers;
    
    // ============ Events ============
    
    event ScoreSubmitted(address indexed player, uint256 score, string gameType, uint256 timestamp);
    event PlayerRegistered(address indexed player, uint256 timestamp);
    event WeeklyPrizesDistributed(address[] winners, uint256[] prizes, uint256 week);
    event PrizePoolFunded(address indexed funder, uint256 amount);
    event WeekReset(uint256 newWeekStart);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier isRegistered() {
        require(playerStats[msg.sender].isRegistered, "Player not registered");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        currentWeekStart = block.timestamp;
    }
    
    // ============ Player Functions ============
    
    /**
     * @notice Register a new player
     */
    function registerPlayer() external {
        require(!playerStats[msg.sender].isRegistered, "Already registered");
        
        playerStats[msg.sender] = PlayerStats({
            highScore: 0,
            totalGamesPlayed: 0,
            totalScore: 0,
            lastPlayed: 0,
            isRegistered: true
        });
        
        registeredPlayers.push(msg.sender);
        
        emit PlayerRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Submit a game score
     * @param _score The score achieved
     * @param _gameType Type of game played (e.g., "target_blitz")
     */
    function submitScore(uint256 _score, string calldata _gameType) external isRegistered {
        require(_score > 0, "Score must be positive");
        
        // Update player stats
        PlayerStats storage stats = playerStats[msg.sender];
        stats.totalGamesPlayed += 1;
        stats.totalScore += _score;
        stats.lastPlayed = block.timestamp;
        
        if (_score > stats.highScore) {
            stats.highScore = _score;
        }
        
        // Create score entry
        PlayerScore memory newScore = PlayerScore({
            player: msg.sender,
            score: _score,
            timestamp: block.timestamp,
            gameType: _gameType
        });
        
        // Check if new week should start
        if (block.timestamp >= currentWeekStart + WEEK_DURATION) {
            _resetWeek();
        }
        
        // Update weekly leaderboard
        _updateLeaderboard(weeklyLeaderboard, newScore);
        
        // Update all-time leaderboard (only high scores)
        if (_score >= stats.highScore) {
            _updateLeaderboard(allTimeLeaderboard, newScore);
        }
        
        emit ScoreSubmitted(msg.sender, _score, _gameType, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the weekly leaderboard
     * @param _limit Number of entries to return
     */
    function getWeeklyLeaderboard(uint256 _limit) external view returns (PlayerScore[] memory) {
        uint256 size = _limit < weeklyLeaderboard.length ? _limit : weeklyLeaderboard.length;
        PlayerScore[] memory result = new PlayerScore[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = weeklyLeaderboard[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get the all-time leaderboard
     * @param _limit Number of entries to return
     */
    function getAllTimeLeaderboard(uint256 _limit) external view returns (PlayerScore[] memory) {
        uint256 size = _limit < allTimeLeaderboard.length ? _limit : allTimeLeaderboard.length;
        PlayerScore[] memory result = new PlayerScore[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allTimeLeaderboard[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get a player's stats
     */
    function getPlayerStats(address _player) external view returns (PlayerStats memory) {
        return playerStats[_player];
    }
    
    /**
     * @notice Get player's rank on weekly leaderboard
     */
    function getWeeklyRank(address _player) external view returns (uint256) {
        for (uint256 i = 0; i < weeklyLeaderboard.length; i++) {
            if (weeklyLeaderboard[i].player == _player) {
                return i + 1;
            }
        }
        return 0; // Not ranked
    }
    
    /**
     * @notice Get total registered players
     */
    function getTotalPlayers() external view returns (uint256) {
        return registeredPlayers.length;
    }
    
    /**
     * @notice Check if week has ended
     */
    function isWeekEnded() external view returns (bool) {
        return block.timestamp >= currentWeekStart + WEEK_DURATION;
    }
    
    /**
     * @notice Get time remaining in current week
     */
    function getWeekTimeRemaining() external view returns (uint256) {
        uint256 weekEnd = currentWeekStart + WEEK_DURATION;
        if (block.timestamp >= weekEnd) {
            return 0;
        }
        return weekEnd - block.timestamp;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Fund the prize pool
     */
    function fundPrizePool() external payable {
        require(msg.value > 0, "Must send funds");
        weeklyPrizePool += msg.value;
        emit PrizePoolFunded(msg.sender, msg.value);
    }
    
    /**
     * @notice Distribute weekly prizes to top 3 players
     */
    function distributePrizes() external onlyOwner {
        require(weeklyLeaderboard.length > 0, "No scores this week");
        require(weeklyPrizePool > 0, "No prize pool");
        
        uint256 totalPrize = weeklyPrizePool;
        weeklyPrizePool = 0;
        
        // Prize distribution: 50% for 1st, 33% for 2nd, 17% for 3rd
        uint256[] memory prizes = new uint256[](3);
        address[] memory winners = new address[](3);
        
        for (uint256 i = 0; i < 3 && i < weeklyLeaderboard.length; i++) {
            winners[i] = weeklyLeaderboard[i].player;
            
            if (i == 0) {
                prizes[i] = (totalPrize * 50) / 100;
            } else if (i == 1) {
                prizes[i] = (totalPrize * 33) / 100;
            } else {
                prizes[i] = (totalPrize * 17) / 100;
            }
            
            if (prizes[i] > 0) {
                payable(winners[i]).transfer(prizes[i]);
            }
        }
        
        emit WeeklyPrizesDistributed(winners, prizes, currentWeekStart);
        
        // Reset for new week
        _resetWeek();
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner).transfer(balance);
    }
    
    // ============ Internal Functions ============
    
    function _updateLeaderboard(PlayerScore[] storage leaderboard, PlayerScore memory newScore) internal {
        // Find if player already exists
        int256 existingIndex = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == newScore.player) {
                // Only update if new score is higher
                if (newScore.score <= leaderboard[i].score) {
                    return; // Don't update if score is not higher
                }
                existingIndex = int256(i);
                break;
            }
        }
        
        // If player exists, remove their old entry
        if (existingIndex >= 0) {
            uint256 idx = uint256(existingIndex);
            for (uint256 j = idx; j < leaderboard.length - 1; j++) {
                leaderboard[j] = leaderboard[j + 1];
            }
            leaderboard.pop();
        }
        
        // Find insert position based on score (descending order)
        uint256 insertIndex = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (newScore.score > leaderboard[i].score) {
                insertIndex = i;
                break;
            }
        }
        
        // Only insert if within max size or if we're replacing an existing position
        if (insertIndex < MAX_LEADERBOARD_SIZE) {
            // Add new entry at end
            leaderboard.push(newScore);
            
            // Shift entries to make room (move from end to insertIndex)
            if (leaderboard.length > 1 && insertIndex < leaderboard.length - 1) {
                for (uint256 i = leaderboard.length - 1; i > insertIndex; i--) {
                    leaderboard[i] = leaderboard[i - 1];
                }
                // Insert new score at correct position
                leaderboard[insertIndex] = newScore;
            }
            
            // Trim to max size
            while (leaderboard.length > MAX_LEADERBOARD_SIZE) {
                leaderboard.pop();
            }
        }
    }
    
    function _resetWeek() internal {
        delete weeklyLeaderboard;
        currentWeekStart = block.timestamp;
        emit WeekReset(currentWeekStart);
    }
    
    // ============ Receive Function ============
    
    receive() external payable {
        weeklyPrizePool += msg.value;
        emit PrizePoolFunded(msg.sender, msg.value);
    }
}
