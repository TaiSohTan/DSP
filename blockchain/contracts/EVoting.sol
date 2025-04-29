// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EVoting {
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
        string description;
        uint256 voteCount;
        bool exists;
    }
    
    // Vote struct to track voter's choices
    struct Vote {
        uint256 candidateId;
        uint256 timestamp;
    }
    
    // Storage
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Vote) public votes;
    mapping(address => bool) public eligibleVoters;
    uint256[] public candidateIds;
    
    // Events
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterAdded(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    
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
    function addCandidate(uint256 _candidateId, string memory _name, string memory _description) public onlyAdmin {
        require(!candidates[_candidateId].exists, "Candidate with this ID already exists");
        
        candidates[_candidateId] = Candidate({
            id: _candidateId,
            name: _name,
            description: _description,
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
        require(votes[msg.sender].timestamp == 0, "You have already voted");
        
        // Record vote
        votes[msg.sender] = Vote({
            candidateId: _candidateId,
            timestamp: block.timestamp
        });
        
        // Increment counts
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        // Emit event
        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }
    
    // Check if a voter has voted
    function hasVoted(address _voter) public view returns (bool) {
        // Check if voter has a recorded vote
        return votes[_voter].timestamp > 0;
    }
    
    // Check if the election is active
    function isElectionActive() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }
    
    // Get candidate information
    function getCandidate(uint256 _candidateId) public view returns (uint256, string memory, string memory, uint256) {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.description, candidate.voteCount);
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
        uint256[] memory voteCounts = new uint256[](candidateIds.length);
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            ids[i] = candidateIds[i];
            voteCounts[i] = candidates[candidateIds[i]].voteCount;
        }
        
        return (ids, voteCounts);
    }
}