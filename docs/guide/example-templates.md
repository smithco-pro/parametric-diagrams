# Example Templates

The project ships with example templates demonstrating different diagram types and parameter patterns. Each template's key is its filename without the `.mmdx` extension, so you can open any of them directly in the [live app](https://smithco-pro.github.io/parametric-diagrams/) with `?template=<key>` (see [Sharing via URL](/guide/getting-started#sharing-via-url)).

The first three are small general-purpose demos. The Omnissa templates document product network topologies and port requirements; they share some conventions: reference notes rendered below the diagram, an `additionalComments` string appended to the main node, and an `includeFooterInChart` boolean that embeds the notes as a footer node inside the diagram itself (useful for exports).

## Network Topology

**File:** `src/templates/network.mmdx`

A top-down network diagram with an internet gateway, firewall, and load balancer feeding into application nodes backed by a database. Parameters rename the load balancer (`lbName`) and toggle the three app nodes, the replica DB, and the Redis cache layer.

## Deployment Flow

**File:** `src/templates/deployment.mmdx`

A left-to-right CI/CD pipeline from developer commit through build, registry, and deployment stages. Parameters rename the developer, repository, and registry nodes and toggle the staging environment (`enableStaging`) and its approval gate (`enableApproval`).

## Sequence Diagram

**File:** `src/templates/sequence.mmdx`

A request/response sequence between client, load balancer, appliance, and database. Parameters rename the client and appliance participants and toggle the load balancer and database steps.

## Omnissa Access 24.12 Connector — Network Topology

**File:** `src/templates/omnissa-access-connector-network.mmdx`

An enterprise integration diagram for the Omnissa Access 24.12 Connector and the services it talks to. This is a good showcase of advanced template features: a `deploymentSize` select (small/medium/large/custom, with custom vCPU/RAM/disk number inputs gated by `showWhen`), a `dirSyncMethod` select (AD-LDAP/IWA/LDAP), and chained conditionals (Horizon and Citrix toggles only appear when the Virtual App service is enabled, and the Citrix StoreFront port only when Citrix is). Further toggles cover user auth, Kerberos auth with an optional load balancer, outbound proxy, RSA SecurID, syslog, and NTP.

## Omnissa AirWatch Cloud Connector — Network Topology

**File:** `src/templates/omnissa-airwatch-cloud-connector.mmdx`

Connectivity for the AirWatch Cloud Connector (ACC) in a Workspace ONE UEM environment. A `deploymentType` select switches between SaaS (environment number) and on-premises (AWCM, Console, and API hostnames/ports) — each mode reveals its own parameters via `showWhen`. A `userRange` select drives sizing guidance, and toggles cover the internal integrations (SMTP, LDAP/AD, SCEP, ADCS, Exchange, Office 365), auto-update, outbound proxy, DNS, NTP, and an optional co-installed Access Connector.

## Omnissa UAG 2603 — DMZ Network Topology

**File:** `src/templates/omnissa-uag-v2603-dmz-network.mmdx`

A Unified Access Gateway 2603 appliance in a DMZ, with front-end/back-end firewalls and per-edge-service port flows. The largest template in the set: each edge service is toggled independently — Horizon (with optional Blast TCP/UDP 8443, PCoIP, RDP, USB redirection, and MMR/CDR ports), Web Reverse Proxy (with identity bridging), Per-App Tunnel (basic, cascade, or front-end/back-end topologies against a SaaS or on-prem UEM), Secure Email Gateway, and Content Gateway (basic or relay) — plus Workspace ONE Intelligence, OPSWAT, Admin UI, and SSH. A `deploymentSize` select (standard/large/extra-large/custom) sets appliance sizing.

## Omnissa Horizon 8 2603 — Connection Server

**File:** `src/templates/omnissa-horizon-v2603-connection-server.mmdx`

Ports and flows around a Horizon 8 2603 Connection Server. Toggles cover replica servers (with a count), Cloud Pod Architecture, an events database select (MS SQL/Oracle/PostgreSQL/none), TrueSSO enrollment, vCenter and ESXi hosts, RADIUS and RSA SecurID authentication, Horizon Cloud Connector, App Volumes Manager monitoring, HTML Access, split management traffic, and a tunneled gateway on the Connection Server.

## Omnissa Horizon 8 2603 — Horizon Agent

**File:** `src/templates/omnissa-horizon-v2603-agent.mmdx`

Traffic to and from the Horizon Agent on a desktop or RDS host, organized by connection mode — internal (direct client), external (via UAG), and tunneled (via Connection Server) — each independently toggleable. Protocol toggles cover Blast Extreme (22443), PCoIP (4172), and RDP (3389), with options for separate CDR/MMR and USB redirection channels, JMS enhanced security, unmanaged agent registration, and the App Volumes agent and DEM ports.

## Omnissa Horizon 8 2603 — App Volumes Manager & DEM

**File:** `src/templates/omnissa-horizon-v2603-app-volumes-dem.mmdx`

App Volumes Manager connectivity for Horizon 8 2603, with toggles for agent-to-manager SSL (443 vs 80), ESXi hosts, and Dynamic Environment Manager file-share traffic (445).

## Omnissa Horizon 8 2603 — TrueSSO Enrollment Server

**File:** `src/templates/omnissa-horizon-v2603-enrollment-server.mmdx`

The TrueSSO Enrollment Server and its connections to paired Connection Servers (configurable count), the certificate authority, and Active Directory. A select chooses the CA dynamic RPC range (modern vs legacy), and a toggle expands the AD domain controller port detail.

## Omnissa Horizon 8 2603 — Horizon Recording Server

**File:** `src/templates/omnissa-horizon-v2603-recording-server.mmdx`

The Horizon Recording Server with its database (PostgreSQL or MS SQL select), agent upload traffic, and admin web console — with toggles for AD LDAPS console login (636) and multi-server configuration import (9443).
