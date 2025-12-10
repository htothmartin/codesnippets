# Felhő és DevOps alapok gyakorlat - Projektmunka

**Név:** Hajagos-Tóth Martin
**Neptun kód:** F1H43C

## Projekt bemutatása

A projekt egy alapvető CRUD alkalmazás, amelyre a felhasználók kódrészleteket tölthetnek fel, majd listázva megtekinthetik a feltöltött tartalmakat.

Alkalmazás elérhetősége: `http://34.172.241.102`

## Tech Stack

A projekt a következő technológiákat használja:

| Komponens | Technológia | Leírás |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) | React keretrendszer a felhasználói felülethez. |
| **Backend** | [Flask](https://flask.palletsprojects.com/) | Könnyűsúlyú Python web keretrendszer az API-hoz. |
| **Adatbázis** | [MongoDB](https://www.mongodb.com/) | NoSQL adatbázis a kódrészletek tárolására. |

## Az alkalmazás működése

### 1. Infrastruktúra

Az alkalmazás a **Google Cloud Platform** környezetében fut.

A virtuális gépet a [terraform/main.tf](terraform/main.tf) fájl manuális futtatásával és a megfelelő SSH kulcsok megadásával hoztam létre.

**Szerver konfiguráció:**
* **Típus:** `e2-micro`
* **OS:** Ubuntu

**Hálózati beállítások (Nyitott portok):**

| Port | Szolgáltatás | Leírás |
| :--- | :--- | :--- |
| `22` | SSH | Távoli eléréshez |
| `80` | HTTP | A webalkalmazás elérése |
| `3001` | Grafana | Monitoring dashboard |
| `9090` | Prometheus | Metrikák gyűjtése |

### 2. CI/CD Pipeline

A CI/CD folyamatokat egy **Jenkins** szerver vezérli, amelyet lokálisan futtattam a `jenkins` mappában elhelyezett `docker-compose.yml` és `Dockerfile` segítségével.

A pipeline definíciója a `Jenkinsfile`-ban található, amely automatizálja a tesztelést, a buildelést és a telepítést.

#### A pipeline folyamat lépései:

1.  **Checkout**
    * A forráskód letöltése a **GitHub** repository-ból.

2.  **Frontend Lint**
    * Dinamikusan létrehoz egy ideiglenes `Dockerfile.lint` fájlt.
    * Lefuttatja a statikus kódanalízist (`npm run lint`) egy izolált Node.js konténerben a kódminőség ellenőrzésére.

3.  **Run backend tests**
    * Felépít egy tesztkörnyezetet a backend számára.
    * Lefuttatja a Python unit teszteket a `pytest` keretrendszerrel.

4.  **Build & Push Backend**
    * Sikeres tesztek esetén elkészíti a backend Docker image-ét (a `Dockerfile.prod` alapján).
    * Feltölti az elkészült image-et a Docker Hub-ra (`martinkka8/backend:latest`).

5.  **Build & Push Frontend**
    * Elkészíti a frontend Docker image-ét.
    * Build argumentumként átadja a backend API URL-jét (`NEXT_PUBLIC_BACKEND_URL`).
    * Feltölti az image-et a Docker Hub-ra (`martinkka8/frontend:latest`).

6.  **Deploy to GCP**
    * **Ansible** segítségével telepíti az új verziót a Google Cloud virtuális gépre.
    * A csatlakozáshoz SSH kulcsot (`gcp-vm-key`) használ.
    * A konfigurációmenedzsmentet és a konténerek frissítését az `ansible/playbook.yml` vezérli.


### 3. Konfiguráció Menedzsment (Ansible)

A szerverek automatizált beállítását és az alkalmazás telepítését az `ansible/playbook.yml` végzi. Ez a playbook biztosítja, hogy a környezet minden telepítéskor konzisztens legyen.

A Playbook főbb feladatai logikai csoportokra bontva:

#### 1. Rendszer optimalizálás (Swap kezelés)
Mivel az infrastruktúrához használt `e2-micro` instanca korlátozott memóriával rendelkezik (1 GB), a playbook első lépésként létrehoz egy **4GB-os SWAP fájlt**.

#### 2. Környezet előkészítése (Docker)
A playbook telepíti a konténerizációhoz szükséges függőségeket:
* Hivatalos Docker GPG kulcs és repository hozzáadása.
* A legfrissebb `docker-ce`, `docker-ce-cli` és `docker-compose-plugin` telepítése.

#### 3. Reverse Proxy (Nginx)
Az alkalmazás elé egy Nginx szerver kerül telepítésre.
* **Konfiguráció:** A saját `nginx.conf` fájl felmásolása a szerverre.
* **Handler:** Az Nginx automatikus újraindítása konfiguráció változás esetén.

#### 4. Alkalmazás Deployment
Ez a szakasz végzi a tényleges alkalmazás kódjának és környezetének frissítését:
* **Mappastruktúra:** Létrehozza a projekt könyvtárat (`/home/ubuntu/app`).
* **Konfigurációs fájlok:**
    * `docker-compose.prod.yml`: Az éles környezet konténer definíciói.
    * `prometheus.yml`: Monitoring konfiguráció.
* **Konténerek indítása:**
    * Letölti a legfrissebb Docker image-eket (`docker compose pull`) DockerHub-ról.
    * Elindítja a konténereket (`docker compose up -d`).
  

### 4. Nginx Reverse Proxy Konfiguráció

A rendszer belépési pontjaként egy **Nginx** webszerver üzemel, amely **Reverse Proxy** módban működik. Ennek fő célja elrejtse a belső szolgáltatásokat a külvilág elől.

1.  **Szolgáltatások elrejtése:**
    A külvilág számára kizárólag a szabványos `80`-as (HTTP) port érhető el. A belső konténerek (Backend: 5000, Frontend: 3000) közvetlenül nem érhetőek el az internetről, így a belső architektúra rejtve marad.

2.  **Routing:**
    Az Nginx a beérkező kérések URL-je alapján dönti el, melyik konténernek továbbítsa az adatokat:
    * **/api/*** útvonal: A kéréseket a **Backend konténer** felé továbbítja.
    * **/** (minden más): A kéréseket a **Frontend konténer** szolgálja ki.
    

### 5. Monitorozás


A monitorozás két fő komponensből áll:

#### 1. Adatgyűjtés: Prometheus (Port: 9090)
* **Elérhetőség:** `http://34.172.241.102:9090`
* **Funkció:** Rendszeres időközönként lekérdezi a metrikákat a FLASK API-tól és Node Exporter-ról (hardver adatokoz).

#### 2. Vizualizáció: Grafana (Port: 3001)
* **Elérhetőség:** `http://34.172.241.102::3001`
* **Funkció:** A Prometheus-hoz kapcsolódva látványos dashboardokon jeleníti meg a rendszer állapotát.
* **Diagramok:** A beállított dashboardokon nyomon követhető a virtuális gép terheltsége, a memória kihasználtság és a hálózati forgalom alakulása a külnböző végpontok között.