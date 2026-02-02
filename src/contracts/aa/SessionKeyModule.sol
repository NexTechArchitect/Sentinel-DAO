
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract SessionKeyModule {
    struct Session {
        address authorizedSigner;
        uint48 validUntil;
        uint256 nonce;
    }

    mapping(address => Session) public sessions;
    uint48 public constant SESSION_DURATION = 12 hours;

    event SessionCreated(address indexed wallet, address indexed signer, uint48 expiry);
    event SessionRevoked(address indexed wallet);

    function createSession(address authorizedSigner) external {
        uint48 expiry;
        unchecked {
            expiry = uint48(block.timestamp + SESSION_DURATION);
        }
        
        uint256 currentNonce = sessions[msg.sender].nonce;
        
        sessions[msg.sender] = Session({
            authorizedSigner: authorizedSigner,
            validUntil: expiry,
            nonce: currentNonce + 1
        });

        emit SessionCreated(msg.sender, authorizedSigner, expiry);
    }

    function isSessionValid(address wallet, address signer) external view returns (bool) {
        Session storage s = sessions[wallet]; 
        return (
            s.authorizedSigner == signer && 
            block.timestamp <= s.validUntil &&
            s.authorizedSigner != address(0)
        );
    }

    function getNonce(address wallet) external view returns (uint256) {
        return sessions[wallet].nonce;
    }

    function revokeSession() external {
        delete sessions[msg.sender];
        emit SessionRevoked(msg.sender);
    }
}