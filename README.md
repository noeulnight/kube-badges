# 🎖️ kube-badges

Real-time Kubernetes cluster status badges in SVG format.

![Nodes](https://badges.limtaehyun.dev/badge/cluster/nodes)
![Deployments](https://badges.limtaehyun.dev/badge/cluster/deployments)
![Pods](https://badges.limtaehyun.dev/badge/cluster/pods)
![Namespaces](https://badges.limtaehyun.dev/badge/cluster/namespaces)

## 📖 Introduction

kube-badges generates SVG badges for Kubernetes cluster resources in real-time, perfect for GitHub READMEs and dashboards.

## ✨ Features

- **Cluster-wide Overview**: Nodes, pods, deployments, and namespace statistics
- **Individual Resource Monitoring**: Status of specific pods, deployments, services, and more
- **Real-time Updates**: Live data from Kubernetes API
- **Customizable**: Various colors and status indicators

## 🚀 Usage

### Cluster Overview

Get an overview of your entire cluster status at a glance.

#### Node Status

```markdown
![Nodes](https://badges.limtaehyun.dev/badge/cluster/nodes)
```

![Nodes](https://badges.limtaehyun.dev/badge/cluster/nodes)

#### Deployment Status

```markdown
![Deployments](https://badges.limtaehyun.dev/badge/cluster/deployments)
```

![Deployments](https://badges.limtaehyun.dev/badge/cluster/deployments)

#### Pod Status

```markdown
![Pods](https://badges.limtaehyun.dev/badge/cluster/pods)
```

![Pods](https://badges.limtaehyun.dev/badge/cluster/pods)

#### Namespace Status

```markdown
![Namespaces](https://badges.limtaehyun.dev/badge/cluster/namespaces)
```

![Namespaces](https://badges.limtaehyun.dev/badge/cluster/namespaces)

### Individual Resources

Monitor specific resources in your cluster.

#### Pod Status

```markdown
![Pod Status](https://badges.limtaehyun.dev/badge/pod/default/my-pod)
```

#### Pod Restart Count

```markdown
![Pod Restarts](https://badges.limtaehyun.dev/badge/pod/default/my-pod/restarts)
```

#### Deployment Replicas

```markdown
![Deployment](https://badges.limtaehyun.dev/badge/deployment/default/my-deployment)
```

#### StatefulSet Replicas

```markdown
![StatefulSet](https://badges.limtaehyun.dev/badge/statefulset/default/my-statefulset)
```

#### DaemonSet Status

```markdown
![DaemonSet](https://badges.limtaehyun.dev/badge/daemonset/kube-system/my-daemonset)
```

#### Service Type

```markdown
![Service](https://badges.limtaehyun.dev/badge/service/default/my-service)
```

#### Node Status

```markdown
![Node](https://badges.limtaehyun.dev/badge/node/node-1)
```

#### Namespace Pod Count

```markdown
![Namespace](https://badges.limtaehyun.dev/badge/namespace/default)
```

## 🎨 Color Scheme

Badges automatically change colors based on resource status:

- 🟢 **Green**: Healthy (Running, Ready, all replicas ready)
- 🟡 **Yellow**: Partially healthy (some replicas ready, Pending)
- 🔴 **Red**: Unhealthy (Failed, NotReady, 0 replicas)
- ⚫ **Gray**: Unknown (resource not found)
- 🔵 **Blue**: Informational (ClusterIP, Succeeded)
- 🟣 **Purple**: NodePort service
- 🟠 **Orange**: LoadBalancer service

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 (Alpine Linux)
- **Framework**: Express.js
- **Kubernetes Client**: @kubernetes/client-node
- **Badge Generator**: badge-maker
- **Build**: TypeScript

## 📦 Deployment

### Docker

Multi-architecture images supported (AMD64, ARM64):

```bash
docker pull ghcr.io/limtaehyun/kube-badges:latest
docker run -d -p 3000:3000 \
  -v ~/.kube/config:/root/.kube/config:ro \
  ghcr.io/limtaehyun/kube-badges:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-badges
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-badges
  template:
    metadata:
      labels:
        app: kube-badges
    spec:
      serviceAccountName: kube-badges
      containers:
        - name: kube-badges
          image: ghcr.io/limtaehyun/kube-badges:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 30
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kube-badges
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kube-badges
rules:
  - apiGroups: ["", "apps"]
    resources:
      [
        "pods",
        "nodes",
        "services",
        "deployments",
        "statefulsets",
        "daemonsets",
        "namespaces",
      ]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kube-badges
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kube-badges
subjects:
  - kind: ServiceAccount
    name: kube-badges
    namespace: default
```

## 🔧 Local Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build
```

### Environment Variables

```bash
# .env file
KUBECONFIG=/path/to/kubeconfig  # Optional, defaults to ~/.kube/config
```
