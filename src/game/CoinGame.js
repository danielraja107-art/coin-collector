import * as THREE from "three";

class CoinGame {
  constructor(container, onScoreChange) {
    this.container = container;
    this.onScoreChange = onScoreChange;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.player = null;
    this.coins = [];

    this.keys = {};

    this.score = 0;

    this.clock = new THREE.Clock();

    this.animationId = null;

    this.moveSpeed = 5;
  }

  start() {
    this.createScene();
    this.createCamera();
    this.createRenderer();

    this.createLights();
    this.createGround();
    this.createPlayer();
    this.createCoins();

    this.setupControls();
    this.update();

    window.addEventListener("resize", this.handleResize);
  }

  createScene() {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x87ceeb);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(0, 10, 12);

    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.5
    );

    this.scene.add(ambientLight);

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2
      );

    directionalLight.position.set(
      10,
      20,
      10
    );

    this.scene.add(directionalLight);
  }

  createGround() {
    const geometry =
      new THREE.PlaneGeometry(30, 30);

    const material =
      new THREE.MeshStandardMaterial({
        color: 0x3a9d23,
      });

    const ground = new THREE.Mesh(
      geometry,
      material
    );

    ground.rotation.x = -Math.PI / 2;

    this.scene.add(ground);
  }

  createPlayer() {
    const geometry =
      new THREE.SphereGeometry(0.5, 32, 32);

    const material =
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
      });

    this.player = new THREE.Mesh(
      geometry,
      material
    );

    this.player.position.set(
      0,
      0.5,
      0
    );

    this.scene.add(this.player);
  }

  createCoins() {
    const coinGeometry =
      new THREE.CylinderGeometry(
        0.4,
        0.4,
        0.15,
        32
      );

    const coinMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
      });

    const coinPositions = [
      [-5, 0.5, -5],
      [5, 0.5, -5],
      [-5, 0.5, 5],
      [5, 0.5, 5],
      [0, 0.5, -7],
      [7, 0.5, 0],
      [-7, 0.5, 0],
      [0, 0.5, 7],
    ];

    coinPositions.forEach((position) => {
      const coin = new THREE.Mesh(
        coinGeometry,
        coinMaterial
      );

      coin.position.set(
        position[0],
        position[1],
        position[2]
      );

      coin.rotation.z = Math.PI / 2;

      this.scene.add(coin);

      this.coins.push(coin);
    });
  }

  setupControls() {
    this.handleKeyDown = (event) => {
      this.keys[event.key.toLowerCase()] = true;
    };

    this.handleKeyUp = (event) => {
      this.keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.addEventListener(
      "keyup",
      this.handleKeyUp
    );
  }

  updatePlayer(delta) {
    const direction = new THREE.Vector3();

    if (
      this.keys["w"] ||
      this.keys["arrowup"]
    ) {
      direction.z -= 1;
    }

    if (
      this.keys["s"] ||
      this.keys["arrowdown"]
    ) {
      direction.z += 1;
    }

    if (
      this.keys["a"] ||
      this.keys["arrowleft"]
    ) {
      direction.x -= 1;
    }

    if (
      this.keys["d"] ||
      this.keys["arrowright"]
    ) {
      direction.x += 1;
    }

    if (direction.length() > 0) {
      direction.normalize();

      const distance =
        this.moveSpeed * delta;

      this.player.position.x +=
        direction.x *
        distance;

      this.player.position.z +=
        direction.z *
        distance;

      const rotation = distance / 0.5;

      this.player.rotation.x +=
        direction.z * rotation;

      this.player.rotation.z -=
        direction.x * rotation;
    }

    // Keep player inside map
    this.player.position.x =
      THREE.MathUtils.clamp(
        this.player.position.x,
        -14,
        14
      );

    this.player.position.z =
      THREE.MathUtils.clamp(
        this.player.position.z,
        -14,
        14
      );
  }

  updateCoins(delta) {
    this.coins.forEach((coin) => {
      if (!coin.visible) return;

      coin.rotation.y += delta * 3;

      const distance =
        this.player.position.distanceTo(
          coin.position
        );

      if (distance < 1.2) {
        coin.visible = false;

        this.score += 1;

        this.onScoreChange(this.score);
      }
    });
  }

  updateCamera() {
    const targetPosition =
      new THREE.Vector3(
        this.player.position.x,
        10,
        this.player.position.z + 12
      );

    this.camera.position.lerp(
      targetPosition,
      0.08
    );

    this.camera.lookAt(
      this.player.position.x,
      0,
      this.player.position.z
    );
  }

  update = () => {
    const delta = this.clock.getDelta();

    this.updatePlayer(delta);

    this.updateCoins(delta);

    this.updateCamera();

    this.renderer.render(
      this.scene,
      this.camera
    );

    this.animationId =
      requestAnimationFrame(this.update);
  };

  handleResize = () => {
    if (!this.camera || !this.renderer) {
      return;
    }

    this.camera.aspect =
      window.innerWidth /
      window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  };

  destroy() {
    cancelAnimationFrame(
      this.animationId
    );

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    window.removeEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.removeEventListener(
      "keyup",
      this.handleKeyUp
    );

    if (this.renderer) {
      this.renderer.dispose();

      if (
        this.renderer.domElement &&
        this.container.contains(
          this.renderer.domElement
        )
      ) {
        this.container.removeChild(
          this.renderer.domElement
        );
      }
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}

export default CoinGame;
