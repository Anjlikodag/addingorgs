#!/bin/bash

function createApple() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/apple.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/apple.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-apple --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-apple.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-apple.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-apple.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-apple.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/apple.example.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-apple --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-apple --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-apple --id.name appleadmin --id.secret appleadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-apple -M ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/msp --csr.hosts peer0.apple.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/apple.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-apple -M ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls --enrollment.profile tls --csr.hosts peer0.apple.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/apple.example.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/apple.example.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/apple.example.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/apple.example.com/tlsca/tlsca.apple.example.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/apple.example.com/ca
  cp ${PWD}/organizations/peerOrganizations/apple.example.com/peers/peer0.apple.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/apple.example.com/ca/ca.apple.example.com-cert.pem

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-apple -M ${PWD}/organizations/peerOrganizations/apple.example.com/users/User1@apple.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/apple.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/apple.example.com/users/User1@apple.example.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://appleadmin:appleadminpw@localhost:7054 --caname ca-apple -M ${PWD}/organizations/peerOrganizations/apple.example.com/users/Admin@apple.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/apple/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/apple.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/apple.example.com/users/Admin@apple.example.com/msp/config.yaml
}

function createFiserv() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/fiserv.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/fiserv.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-fiserv --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-fiserv.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-fiserv.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-fiserv.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-fiserv.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-fiserv --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-fiserv --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-fiserv --id.name fiservadmin --id.secret fiservadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-fiserv -M ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/msp --csr.hosts peer0.fiserv.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-fiserv -M ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls --enrollment.profile tls --csr.hosts peer0.fiserv.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/fiserv.example.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/tlsca/tlsca.fiserv.example.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/fiserv.example.com/ca
  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/peers/peer0.fiserv.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/fiserv.example.com/ca/ca.fiserv.example.com-cert.pem

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-fiserv -M ${PWD}/organizations/peerOrganizations/fiserv.example.com/users/User1@fiserv.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/fiserv.example.com/users/User1@fiserv.example.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://fiservadmin:fiservadminpw@localhost:8054 --caname ca-fiserv -M ${PWD}/organizations/peerOrganizations/fiserv.example.com/users/Admin@fiserv.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/fiserv/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/fiserv.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/fiserv.example.com/users/Admin@fiserv.example.com/msp/config.yaml
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir -p ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml
}
