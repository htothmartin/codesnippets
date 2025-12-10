provider "google" {
  credentials = file("gcp-key.json")
  project = "code-snippets-480514"

  region = "us-central1"
  zone = "us-central1-a"
}

resource "google_compute_instance" "devops_server" {
  name         = "devops-vm"
  machine_type = "e2-micro"
  tags         = ["web-server", "http-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 28
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"
    access_config {
    }
  }

  metadata = {
    ssh-keys = "ubuntu:${file("id_rsa.pub")}"
  }
}

resource "google_compute_firewall" "allow_web" {
  name    = "allow-web-traffic-free"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3001", "9090"] 
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

output "ip" {
  value = google_compute_instance.devops_server.network_interface.0.access_config.0.nat_ip
}