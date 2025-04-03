// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EVoting
 * @dev Manages an election with multiple candidates where eligible voters can cast votes
 */
contract EVoting {
    // Election data
    string public electionTitle;
    string public electionDescription;
    uint256 public startTime;
    uint256 public endTime;
    address public electionAdmin;
    
    // Candidate data
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }
    
    // Maps candidate IDs to Candidate structs
    mapping(uint256 => Candidate) public candidates;
    
    // Maps voter addresses to whether they have voted
    mapping(address => bool) public hasVoted;
    
    // Store candidates for iteration
    uint256[] public candidateIds;
    
    // Tracking metrics
    uint256 public totalVotes;
    
    // Voter validation - maps eligible voter addresses to boolean
    mapping(address => bool) public eligibleVoters;
    
    // Events
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event VoterAdded(address indexed voter);
    event ElectionStarted(uint256 startTime, uint256 endTime);
    event ElectionEnded();
    
    // Constructor
    constructor(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) {
        require(_startTime < _endTime, "Start time must be before end time");
        
        electionTitle = _title;
        electionDescription = _description;
        startTime = _startTime;
        endTime = _endTime;
        electionAdmin = msg.sender;
    }
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == electionAdmin, "Only the election admin can call this function");
        _;
    }
    
    modifier electionActive() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Election is not active");
        _;
    }
    
    modifier electionNotEnded() {
        require(block.timestamp <= endTime, "Election has ended");
        _;
    }
    
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }
    
    modifier isEligibleVoter() {
        require(eligibleVoters[msg.sender], "You are not eligible to vote");
        _;
    }
    
    // Election management functions
    function addCandidate(uint256 _id, string memory _name, string memory _party) public onlyAdmin electionNotEnded {
        require(candidates[_id].id == 0, "Candidate ID already exists");
        
        candidates[_id] = Candidate({
            id: _id,
            name: _name,
            party: _party,
            voteCount: 0
        });
        
        candidateIds.push(_id);
        
        emit CandidateAdded(_id, _name, _party);
    }
    
    function addEligibleVoter(address _voter) public onlyAdmin electionNotEnded {
        require(!eligibleVoters[_voter], "Voter already eligible");
        
        eligibleVoters[_voter] = true;
        
        emit VoterAdded(_voter);
    }
    
    function addEligibleVoters(address[] memory _voters) public onlyAdmin electionNotEnded {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!eligibleVoters[_voters[i]]) {
                eligibleVoters[_voters[i]] = true;
                emit VoterAdded(_voters[i]);
            }
        }
    }
    
    // Voting function
    function castVote(uint256 _candidateId) public electionActive hasNotVoted isEligibleVoter {
        require(candidates[_candidateId].id != 0, "Invalid candidate ID");
        
        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateId);
    }
    
    // View functions
    function getCandidateCount() public view returns (uint256) {
        return candidateIds.length;
    }
    
    function getCandidate(uint256 _id) public view returns (uint256, string memory, string memory, uint256) {
        require(candidates[_id].id != 0, "Candidate does not exist");
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.party, c.voteCount);
    }
    
    function getAllCandidates() public view returns (uint256[] memory) {
        return candidateIds;
    }
    
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
            electionTitle,
            electionDescription,
            startTime,
            endTime,
            electionAdmin,
            totalVotes,
            candidateIds.length
        );
    }
    
    // Check if election is active
    function isElectionActive() public view returns (bool) {
        return (block.timestamp >= startTime && block.timestamp <= endTime);
    }
    
    // Election results - only accessible after election ends
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