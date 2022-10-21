#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function createCitizenBank {
	infoln "Enrolling the CA admin"
	mkdir -p ../organizations/peerOrganizations/citizenBank.example.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/citizenBank.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-citizenBank --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-citizenBank.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-citizenBank.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-citizenBank.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-citizenBank.pem
    OrganizationalUnitIdentifier: orderer' > ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/config.yaml

	infoln "Registering peer0"
  set -x
	fabric-ca-client register --caname ca-citizenBank --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-citizenBank --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-citizenBank --id.name citizenBankadmin --id.secret citizenBankadminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
	fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-citizenBank -M ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/msp --csr.hosts peer0.citizenBank.example.com --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/config.yaml ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-citizenBank -M ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls --enrollment.profile tls --csr.hosts peer0.citizenBank.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null


  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/tlscacerts/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/ca.crt
  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/signcerts/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/server.crt
  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/keystore/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/server.key

  mkdir ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/tlscacerts
  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/tlscacerts/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/tlsca
  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/tls/tlscacerts/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/tlsca/tlsca.citizenBank.example.com-cert.pem

  mkdir ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/ca
  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/peers/peer0.citizenBank.example.com/msp/cacerts/* ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/ca/ca.citizenBank.example.com-cert.pem

  infoln "Generating the user msp"
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-citizenBank -M ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/users/User1@citizenBank.example.com/msp --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/config.yaml ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/users/User1@citizenBank.example.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
	fabric-ca-client enroll -u https://citizenBankadmin:citizenBankadminpw@localhost:11054 --caname ca-citizenBank -M ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/users/Admin@citizenBank.example.com/msp --tls.certfiles ${PWD}/fabric-ca/citizenBank/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/msp/config.yaml ${PWD}/../organizations/peerOrganizations/citizenBank.example.com/users/Admin@citizenBank.example.com/msp/config.yaml
}
