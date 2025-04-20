// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectionVoting {
    // Election details
    string public title;
    string public description;
    uint256 public startTime;
    uint256 public endTime;
    address public admin;
    uint256 public totalVotes;
    
    // Candidate struct
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool exists;
    }
    
    // Vote struct to track voter's choices
    struct Vote {
        uint256 candidateId;
        bool isActive; // New field to track if vote is active or nullified
        uint256 timestamp;
    }
    
    // Storage
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Vote) public votes;
    mapping(address => bool) public eligibleVoters;
    mapping(address => Vote[]) public nullifiedVotes; // Track nullified votes for audit
    uint256[] public candidateIds;
    
    // Events
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterAdded(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event VoteNullified(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event NewVoteAfterNullification(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the election admin can perform this action");
        _;
    }
    
    modifier onlyEligible() {
        require(eligibleVoters[msg.sender], "You are not eligible to vote in this election");
        _;
    }
    
    modifier electionActive() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Election is not active");
        _;
    }
    
    // Constructor
    constructor(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) {
        admin = msg.sender;
        title = _title;
        description = _description;
        startTime = _startTime;
        endTime = _endTime;
    }
    
    // Add a candidate to the election
    function addCandidate(uint256 _candidateId, string memory _name, string memory _party) public onlyAdmin {
        require(!candidates[_candidateId].exists, "Candidate with this ID already exists");
        
        candidates[_candidateId] = Candidate({
            id: _candidateId,
            name: _name,
            party: _party,
            voteCount: 0,
            exists: true
        });
        
        candidateIds.push(_candidateId);
        
        emit CandidateAdded(_candidateId, _name);
    }
    
    // Add an eligible voter
    function addEligibleVoter(address _voter) public onlyAdmin {
        require(!eligibleVoters[_voter], "Voter is already eligible");
        
        eligibleVoters[_voter] = true;
        
        emit VoterAdded(_voter);
    }
    
    // Cast a vote
    function castVote(uint256 _candidateId) public onlyEligible electionActive {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        
        // If this voter already has a vote, handle differently based on if it's active
        if (hasVoted(msg.sender)) {
            require(!votes[msg.sender].isActive, "You already have an active vote");
            
            // This is a revote after nullification - store previous vote in audit trail
            nullifiedVotes[msg.sender].push(votes[msg.sender]);
            
            // Decrease previous candidate's count
            candidates[votes[msg.sender].candidateId].voteCount--;
            
            // Record new vote
            votes[msg.sender] = Vote({
                candidateId: _candidateId,
                isActive: true,
                timestamp: block.timestamp
            });
            
            // Increment candidate vote count
            candidates[_candidateId].voteCount++;
            
            // Emit event
            emit NewVoteAfterNullification(msg.sender, _candidateId, block.timestamp);
        } else {
            // First time voting
            votes[msg.sender] = Vote({
                candidateId: _candidateId,
                isActive: true,
                timestamp: block.timestamp
            });
            
            // Increment counts
            candidates[_candidateId].voteCount++;
            totalVotes++;
            
            // Emit event
            emit VoteCast(msg.sender, _candidateId, block.timestamp);
        }
    }
    
    // Nullify a vote - can only be called by admin
    function nullifyVote(address _voter) public onlyAdmin {
        require(hasVoted(_voter), "No vote to nullify");
        require(votes[_voter].isActive, "Vote is already nullified");
        
        // Get the candidate ID before nullifying
        uint256 candidateId = votes[_voter].candidateId;
        
        // Mark vote as inactive
        votes[_voter].isActive = false;
        
        // Decrease candidate vote count
        candidates[candidateId].voteCount--;
        
        // Decrease total votes
        totalVotes--;
        
        // Emit event
        emit VoteNullified(_voter, candidateId, block.timestamp);
    }
    
    // Check if a voter has voted
    function hasVoted(address _voter) public view returns (bool) {
        // Check if voter has a recorded vote (regardless of active status)
        return votes[_voter].timestamp > 0;
    }
    
    // Get nullification history count for a voter
    function getNullificationCount(address _voter) public view returns (uint256) {
        return nullifiedVotes[_voter].length;
    }
    
    // Check if a specific vote is active
    function isVoteActive(address _voter) public view returns (bool) {
        return votes[_voter].isActive && votes[_voter].timestamp > 0;
    }
    
    // Check if the election is active
    function isElectionActive() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }
    
    // Get candidate information
    function getCandidate(uint256 _candidateId) public view returns (uint256, string memory, string memory, uint256) {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.party, candidate.voteCount);
    }
    
    // Get all candidate IDs
    function getAllCandidates() public view returns (uint256[] memory) {
        return candidateIds;
    }
    
    // Get election information
    function getElectionInfo() public view returns (
        string memory,
        string memory,
        uint256,
        uint256,
        address,
        uint256,
        uint256
    ) {
        return (
            title,
            description,
            startTime,
            endTime,
            admin,
            totalVotes,
            candidateIds.length
        );
    }
    
    // Get election results
    function getElectionResults() public view returns (uint256[] memory, uint256[] memory) {
        uint256[] memory ids = new uint256[](candidateIds.length);
        uint256[] memory votes = new uint256[](candidateIds.length);
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            ids[i] = candidateIds[i];
            votes[i] = candidates[candidateIds[i]].voteCount;
        }
        
        return (ids, votes);
    }
}