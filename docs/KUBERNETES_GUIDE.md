# Impromptu-AI Containerization & Kubernetes Guide

This guide provides a comprehensive overview of how the Impromptu-AI project is containerized using Docker and deployed using Kubernetes.

---

## Part 1: Dockerization & Local Development

### How Docker Works
Docker packages an application and all its dependencies into a standardized unit called a **container**. Containers isolate software from its environment and ensure it works uniformly despite differences for instance between development and staging.

### How Images are Built
We use **multi-stage builds** in our Dockerfiles to keep image sizes small. 
- The `frontend` builds using Node, but the final image only contains the compiled static assets and an Nginx server.
- The `backend` installs all dependencies for building, but only copies `production` dependencies to the final image.
- The `ai-service` uses a slim Python image and installs dependencies efficiently by leveraging Docker's layer caching mechanism (copying `requirements.txt` before the rest of the code).

### Local Deployment with Docker Compose
`docker-compose.yml` orchestrates all our services locally. 

**How to deploy locally:**
1. Create `.env` files in `frontend`, `backend`, and `ai_service` based on their respective examples.
2. Run `docker-compose up --build -d`.
3. The services will communicate over the internal `impromptu-network`.

**How containers communicate:**
Docker Compose creates an internal bridge network (`impromptu-network`). Containers can resolve each other using their service names (e.g., `http://ai-service:8000`) instead of IP addresses.

---

## Part 2: Kubernetes Concepts

### How Kubernetes Pods work
A Pod is the smallest deployable unit in Kubernetes. It encapsulates one or more containers that share storage, network, and specifications for how to run the containers. For example, our `ai-worker-deployment` creates pods running the RQ worker container.

### How Deployments work
Deployments manage the lifecycle of Pods. They ensure a specified number of replicas are running at any given time and handle updates.

### How Rolling Updates work
We configure Deployments with the `RollingUpdate` strategy (`maxSurge: 1`, `maxUnavailable: 0`). When updating an image, Kubernetes creates a new pod, waits for it to become ready (via readiness probes), and only then terminates an old pod, ensuring zero downtime.

### How Services work
Pods are ephemeral (they are created and destroyed frequently). A **Service** provides a stable IP address and DNS name to access a group of Pods. We use `ClusterIP` services to expose applications only within the cluster.

### How DNS works
Kubernetes runs an internal DNS server. Services can be accessed using the format `<service-name>.<namespace>.svc.cluster.local`. Our backend reaches the AI service at `http://ai-service.impromptu-ai.svc.cluster.local:8000`. No hardcoded IP addresses or `localhost` are used.

### How ConfigMaps & Secrets work
- **ConfigMaps** store non-confidential data in key-value pairs (e.g., `NODE_ENV`). They decouple environment-specific configuration from container images.
- **Secrets** store sensitive data (e.g., API keys, Database URLs) securely. They are mounted as environment variables.

### How Ingress works
An **Ingress** exposes HTTP and HTTPS routes from outside the cluster to Services within the cluster. It acts as a reverse proxy (usually powered by NGINX). In our setup, it routes external traffic to the `frontend-service`.

### How Autoscaling works (HPA)
The **Horizontal Pod Autoscaler (HPA)** automatically updates a workload resource (like a Deployment) to match demand. We configured HPA to scale the `backend` and `ai-service` between 2 and 10 replicas based on a target CPU utilization of 75%.

---

## Part 3: Deployment Instructions

### Prerequisites
- Docker & Docker Compose
- `kubectl`
- A Kubernetes cluster (Minikube, Kind, or a Cloud Provider like GKE/EKS)

### 1. Build and Push Docker Images
If using a cloud cluster, you must build and push your images to a container registry:
```bash
docker build -t your-registry/frontend:latest ./frontend
docker push your-registry/frontend:latest

docker build -t your-registry/backend:latest ./backend
docker push your-registry/backend:latest

docker build -t your-registry/ai-service:latest ./ai_service
docker push your-registry/ai-service:latest
```
*(Remember to update the `image:` fields in the `k8s/*-deployment.yaml` files with your registry paths).*

### 2. Configure Secrets
Edit `k8s/secret.yaml` and replace the placeholder values with actual base64 encoded secrets. (In a real production environment, use a tool like Sealed Secrets or AWS Secrets Manager).

### 3. Deploying to Minikube
Minikube runs a single-node cluster locally.

1. Start Minikube: `minikube start`
2. Enable Ingress addon: `minikube addons enable ingress`
3. Enable metrics-server addon (required for HPA): `minikube addons enable metrics-server`
4. Apply the Kustomization: `kubectl apply -k k8s/`
5. Get the Minikube IP: `minikube ip`
6. Map the Minikube IP in your `/etc/hosts` file to access the Ingress locally if a host rule was added, otherwise access the IP directly.

### 4. Deploying to Kind
Kind runs Kubernetes nodes in Docker containers.

1. Create a cluster with Ingress support enabled in the config.
2. Load your local Docker images into the Kind cluster: 
   `kind load docker-image frontend:latest backend:latest ai-service:latest`
3. Install the NGINX Ingress controller for Kind.
4. Apply the Kustomization: `kubectl apply -k k8s/`

### 5. Deploying to a Cloud Cluster
1. Ensure your `kubectl` context is set to your cloud cluster.
2. Ensure you have an Ingress Controller (like NGINX or ALB) installed.
3. Apply the configuration: `kubectl apply -k k8s/`

---

## Deployment Checklist & Verification

Follow these steps to confirm every service is functioning correctly:

- [ ] **Pods are Running:** `kubectl get pods -n impromptu-ai`. Ensure all pods are in the `Running` state and 2/2 ready.
- [ ] **Services are Active:** `kubectl get svc -n impromptu-ai`. Verify ClusterIPs are assigned.
- [ ] **Ingress is Configured:** `kubectl get ingress -n impromptu-ai`. Verify it has acquired an IP address.
- [ ] **Network Policies:** Verify isolation by creating a temporary busybox pod in the `default` namespace and attempting to `curl` the backend service. It should time out.
- [ ] **HPA is Active:** `kubectl get hpa -n impromptu-ai`. Ensure the targets show CPU utilization (e.g., `5%/75%`). If it says `<unknown>`, ensure the `metrics-server` is installed in your cluster.
- [ ] **End-to-End Test:** Access the frontend URL. Perform an action that triggers the backend, which in turn calls the AI service and writes to the Redis queue. Verify the AI Worker processes the queue successfully by checking its logs: `kubectl logs -l app.kubernetes.io/name=ai-worker -n impromptu-ai`.
