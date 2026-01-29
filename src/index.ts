import express from "express";
import * as k8s from "@kubernetes/client-node";
import { makeBadge } from "badge-maker";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const app = express();

const kc = new k8s.KubeConfig();
if (process.env.KUBECONFIG) {
  kc.loadFromFile(process.env.KUBECONFIG);
} else {
  kc.loadFromDefault();
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

function createBadge(label: string, message: string, color: string): string {
  return makeBadge({
    label,
    message,
    color,
    style: "flat",
  });
}

app.get("/", (req, res) => {
  res.send(`
    <h1>Kubernetes Badges</h1>
    <h3>Individual Resources:</h3>
    <ul>
      <li>/badge/pod/:namespace/:name - Specific pod status</li>
      <li>/badge/pod/:namespace/:name/restarts - Pod restart count</li>
      <li>/badge/deployment/:namespace/:name - Specific deployment replicas</li>
      <li>/badge/statefulset/:namespace/:name - Specific statefulset replicas</li>
      <li>/badge/daemonset/:namespace/:name - Specific daemonset status</li>
      <li>/badge/service/:namespace/:name - Service type (ClusterIP/NodePort/LoadBalancer)</li>
      <li>/badge/node/:name - Specific node status</li>
      <li>/badge/namespace/:name - Pod count in namespace</li>
    </ul>
    <h3>Cluster Overview:</h3>
    <ul>
      <li>/badge/cluster/nodes - Total node count</li>
      <li>/badge/cluster/deployments - Total deployment count</li>
      <li>/badge/cluster/pods - Total pod count</li>
      <li>/badge/cluster/namespaces - Total namespace count</li>
    </ul>
  `);
});

app.get("/health", async (req, res) => {
  try {
    const response = await k8sApi.listNamespace();
    res.json({
      status: "connected",
      namespaces: response.items.length,
      message: "Successfully connected to K8s API Server via Tailscale",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/badge/pod/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.readNamespacedPod({ name, namespace });

    const phase = response.status?.phase || "Unknown";
    const colorMap: Record<string, string> = {
      Running: "green",
      Pending: "yellow",
      Succeeded: "blue",
      Failed: "red",
      Unknown: "gray",
    };
    const color = colorMap[phase] || "gray";

    const badge = createBadge(name, phase, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/pod/:namespace/:name/restarts", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.readNamespacedPod({ name, namespace });

    const totalRestarts =
      response.status?.containerStatuses?.reduce(
        (sum, container) => sum + (container.restartCount || 0),
        0,
      ) || 0;

    const message = `${totalRestarts} restarts`;
    const color =
      totalRestarts === 0 ? "green" : totalRestarts < 5 ? "yellow" : "red";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/deployment/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await appsApi.readNamespacedDeployment({
      name,
      namespace,
    });

    const desired = response.spec?.replicas || 0;
    const ready = response.status?.readyReplicas || 0;
    const message = `${ready}/${desired}`;
    const color =
      ready === desired && desired > 0 ? "green" : ready > 0 ? "yellow" : "red";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/statefulset/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await appsApi.readNamespacedStatefulSet({
      name,
      namespace,
    });

    const desired = response.spec?.replicas || 0;
    const ready = response.status?.readyReplicas || 0;
    const message = `${ready}/${desired}`;
    const color =
      ready === desired && desired > 0 ? "green" : ready > 0 ? "yellow" : "red";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/daemonset/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await appsApi.readNamespacedDaemonSet({ name, namespace });

    const desired = response.status?.desiredNumberScheduled || 0;
    const ready = response.status?.numberReady || 0;
    const message = `${ready}/${desired}`;
    const color =
      ready === desired && desired > 0 ? "green" : ready > 0 ? "yellow" : "red";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/service/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.readNamespacedService({ name, namespace });

    const serviceType = response.spec?.type || "Unknown";
    const colorMap: Record<string, string> = {
      ClusterIP: "blue",
      NodePort: "purple",
      LoadBalancer: "orange",
      ExternalName: "gray",
    };
    const color = colorMap[serviceType] || "gray";

    const badge = createBadge(name, serviceType, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/node/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await k8sApi.readNode({ name });

    const readyCondition = response.status?.conditions?.find(
      (c) => c.type === "Ready",
    );
    const isReady = readyCondition?.status === "True";
    const message = isReady ? "Ready" : "NotReady";
    const color = isReady ? "green" : "red";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/namespace/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await k8sApi.listNamespacedPod({ namespace: name });
    const count = response.items.length;
    const message = `${count} pods`;
    const color = count > 0 ? "blue" : "gray";

    const badge = createBadge(name, message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge(req.params.name, "Not Found", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/cluster/nodes", async (req, res) => {
  try {
    const response = await k8sApi.listNode();
    const totalNodes = response.items.length;
    const readyNodes = response.items.filter((node) => {
      const readyCondition = node.status?.conditions?.find(
        (c) => c.type === "Ready",
      );
      return readyCondition?.status === "True";
    }).length;

    const message = `${readyNodes}/${totalNodes} ready`;
    const color =
      readyNodes === totalNodes ? "green" : readyNodes > 0 ? "yellow" : "red";

    const badge = createBadge("nodes", message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge("nodes", "Error", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/cluster/deployments", async (req, res) => {
  try {
    const response = await appsApi.listDeploymentForAllNamespaces();
    const totalDeployments = response.items.length;
    const readyDeployments = response.items.filter((deployment) => {
      const desired = deployment.spec?.replicas || 0;
      const ready = deployment.status?.readyReplicas || 0;
      return desired === ready && desired > 0;
    }).length;

    const message = `${readyDeployments}/${totalDeployments} ready`;
    const color =
      readyDeployments === totalDeployments && totalDeployments > 0
        ? "green"
        : readyDeployments > 0
          ? "yellow"
          : "red";

    const badge = createBadge("deployments", message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge("deployments", "Error", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/cluster/pods", async (req, res) => {
  try {
    const response = await k8sApi.listPodForAllNamespaces();
    const totalPods = response.items.length;
    const runningPods = response.items.filter(
      (pod) => pod.status?.phase === "Running",
    ).length;

    const message = `${runningPods}/${totalPods} running`;
    const color =
      runningPods === totalPods && totalPods > 0
        ? "green"
        : runningPods > 0
          ? "yellow"
          : totalPods > 0
            ? "red"
            : "gray";

    const badge = createBadge("pods", message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge("pods", "Error", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.get("/badge/cluster/namespaces", async (req, res) => {
  try {
    const response = await k8sApi.listNamespace();
    const totalNamespaces = response.items.length;
    const activeNamespaces = response.items.filter(
      (ns) => ns.status?.phase === "Active",
    ).length;

    const message = `${activeNamespaces}/${totalNamespaces} active`;
    const color = activeNamespaces === totalNamespaces ? "green" : "yellow";

    const badge = createBadge("namespaces", message, color);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  } catch (error) {
    const badge = createBadge("namespaces", "Error", "red");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(badge);
  }
});

app.listen(3000, async () => {
  console.log("Server is running on port 3000");
});
