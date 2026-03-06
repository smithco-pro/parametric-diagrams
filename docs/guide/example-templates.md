# Example Templates

The project ships with several example templates demonstrating different diagram types and parameter patterns.

## Network Topology

**File:** `src/templates/network.mmdx`

A top-down network diagram with an internet gateway, firewall, and load balancer feeding into application nodes backed by a database.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lbName` | string | `Load Balancer` | Load balancer display name |
| `appNode1` | boolean | `true` | Show/hide Appliance Node 1 |
| `appNode2` | boolean | `true` | Show/hide Appliance Node 2 |
| `appNode3` | boolean | `true` | Show/hide Appliance Node 3 |
| `enableReplica` | boolean | `true` | Show/hide Replica DB |
| `enableCache` | boolean | `true` | Show/hide Redis Cache layer |

## Deployment Flow

**File:** `src/templates/deployment.mmdx`

A left-to-right CI/CD pipeline from developer commit through build, registry, and deployment stages.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `devName` | string | `Developer` | Developer node label |
| `repoName` | string | `Git Repo` | Repository node label |
| `registryName` | string | `Artifact Registry` | Registry node label |
| `enableStaging` | boolean | `true` | Include staging environment |
| `enableApproval` | boolean | `true` | Include approval/rejection gate (requires staging) |

## Sequence Diagram

**File:** `src/templates/sequence.mmdx`

A request/response sequence between client, load balancer, appliance, and database.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientName` | string | `Client` | Client participant name |
| `appName` | string | `Appliance` | Appliance participant name |
| `enableLB` | boolean | `true` | Include load balancer in the flow |
| `enableDB` | boolean | `true` | Include database query step |

## Omnissa Access Connector Network

**File:** `src/templates/omnissa-access-connector-network.mmdx`

A complex enterprise integration diagram for the Omnissa Access 24.12 Connector, demonstrating advanced template features with 20 parameters including conditional subgraphs, port validation, and nested conditionals.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `connectorName` | string | `Access Connector` | Connector display name |
| `connectorIP` | string | `10.0.1.50` | Connector IP address |
| `deploymentSpec` | string | `2 vCPU / 6 GB RAM / 50 GB Disk` | Deployment spec label |
| `isCloud` | boolean | `true` | Cloud vs on-prem deployment |
| `enableKerberosLB` | boolean | `false` | Kerberos load balancer |
| `enableDirSync` | boolean | `true` | Directory sync service |
| `enableUserAuth` | boolean | `true` | User authentication |
| `enableKerberosAuth` | boolean | `false` | Kerberos authentication |
| `enableVirtualApp` | boolean | `false` | Virtual app integration |
| `enableProxy` | boolean | `false` | HTTP proxy |
| `enableRSA` | boolean | `false` | RSA SecurID integration |
| `enableSyslog` | boolean | `false` | Syslog connection |
| `enableNTP` | boolean | `false` | NTP server |
| `enableHorizon` | boolean | `false` | Horizon integration |
| `enableCitrix` | boolean | `false` | Citrix integration |
| `rsaPort` | number | `5555` | RSA SecurID port (1-65535) |
| `syslogPort` | number | `514` | Syslog port (1-65535) |
| `citrixSFPort` | number | `443` | Citrix StoreFront port (1-65535) |
| `accessServiceHost` | string | `access.example.com` | Access service hostname |
| `lbName` | string | `Kerberos LB` | Load balancer name |
