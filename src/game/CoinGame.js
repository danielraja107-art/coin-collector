import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
    this.mixer = null;
    this.walkAction = null;
    this.idleAction = null;
    this.isMoving = false;
    this.gltfLoader = new GLTFLoader();

    this.moveSpeed = 5;
  }

  start() {
    this.createScene();
    this.createCamera();
    this.createRenderer();

    this.createLights();
    this.createGround();
    this.createEnvironment();
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(30, 30);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a9d23,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  createPlayer() {
    this.gltfLoader.load(
      "/models/minions/minion-a01.glb",
      (gltf) => {
        this.player = gltf.scene;
        this.player.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
          }
        });

        // Measure actual model dimensions
        const box = new THREE.Box3().setFromObject(this.player);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Scale to target height of 1.8 world units
        const targetHeight = 1.8;
        const scaleFactor = targetHeight / size.y;
        this.player.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Reposition: place feet on ground (Y=0)
        // After scaling, min.y shifts proportionally
        const scaledMinY = box.min.y * scaleFactor;
        this.player.position.set(0, -scaledMinY, 0);
        this.scene.add(this.player);

        this.setupAnimations(gltf);
      },
      undefined,
      (error) => {
        console.error("Error loading Minion model:", error);
        this.createFallbackPlayer();
      }
    );
  }

  createFallbackPlayer() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.set(0, 0.5, 0);
    this.scene.add(this.player);
  }

  setupAnimations(gltf) {
    if (!gltf.animations || !gltf.animations.length) return;

    this.mixer = new THREE.AnimationMixer(this.player);

    gltf.animations.forEach((clip, index) => {
      console.log(`Animation ${index}: ${clip.name}`);
    });

    const walkClip = gltf.animations.find(
      (clip) =>
        clip.name.toLowerCase().includes("walk") ||
        clip.name.toLowerCase().includes("move") ||
        clip.name.toLowerCase().includes("run")
    );

    const idleClip = gltf.animations.find(
      (clip) =>
        clip.name.toLowerCase().includes("idle") ||
        clip.name.toLowerCase().includes("stand")
    );

    if (walkClip) {
      this.walkAction = this.mixer.clipAction(walkClip);
    }

    if (idleClip) {
      this.idleAction = this.mixer.clipAction(idleClip);
      this.idleAction.play();
    } else if (!walkClip && gltf.animations.length) {
      this.idleAction = this.mixer.clipAction(gltf.animations[0]);
      this.idleAction.play();
    }
  }

  createCoins() {
    const coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({
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
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(position[0], position[1], position[2]);
      coin.rotation.z = Math.PI / 2;
      this.scene.add(coin);
      this.coins.push(coin);
    });
  }

  createEnvironment() {
    this.gltfLoader.load(
      "/models/tree/dead_tree_trunk_02_1k.gltf/dead_tree_trunk_02_1k.gltf",
      (gltf) => {
        const treeModel = gltf.scene;
        treeModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Measure actual tree dimensions
        const box = new THREE.Box3().setFromObject(treeModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Scale to target height of 3.0 world units
        const targetHeight = 3.0;
        const scaleFactor = targetHeight / size.y;
        treeModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Calculate Y offset so tree base sits on ground (Y=0)
        const scaledMinY = box.min.y * scaleFactor;

        const treePositions = [
          [-8, 0, -8],
          [8, 0, -8],
          [-8, 0, 8],
          [8, 0, 8],
          [-6, 0, 0],
          [6, 0, 0],
          [0, 0, -6],
          [0, 0, 6],
          [-4, 0, 4],
          [4, 0, -4],
          [-10, 0, -2],
          [10, 0, 2],
        ];

        treePositions.forEach((position) => {
          const tree = treeModel.clone();
          tree.position.set(position[0], -scaledMinY, position[2]);
          tree.rotation.y = Math.random() * Math.PI * 2;
          this.scene.add(tree);
        });
      },
      undefined,
      (error) => {
        console.error("Error loading tree model:", error);
      }
    );
  }

  setupControls() {
    this.handleKeyDown = (event) => {
      this.keys[event.key.toLowerCase()] = true;
    };

    this.handleKeyUp = (event) => {
      this.keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  getActivePlayer() {
    return this.player;
  }

  updatePlayer(delta) {
    const player = this.getActivePlayer();
    if (!player) return;

    const direction = new THREE.Vector3();

    if (this.keys["w"] || this.keys["arrowup"]) {
      direction.z -= 1;
    }

    if (this.keys["s"] || this.keys["arrowdown"]) {
      direction.z += 1;
    }

    if (this.keys["a"] || this.keys["arrowleft"]) {
      direction.x -= 1;
    }

    if (this.keys["d"] || this.keys["arrowright"]) {
      direction.x += 1;
    }

    const wasMoving = this.isMoving;
    this.isMoving = direction.length() > 0;

    if (this.isMoving) {
      direction.normalize();

      const distance = this.moveSpeed * delta;

      player.position.x += direction.x * distance;
      player.position.z += direction.z * distance;

      const angle = Math.atan2(direction.x, direction.z);
      player.rotation.y = angle;
    }

    if (this.isMoving !== wasMoving) {
      this.toggleAnimation(this.isMoving);
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, -14, 14);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -14, 14);
  }

  toggleAnimation(moving) {
    if (!this.mixer) return;

    if (moving && this.walkAction) {
      if (this.idleAction) this.idleAction.fadeOut(0.2);
      this.walkAction.reset().fadeIn(0.2).play();
    } else if (!moving && this.idleAction) {
      if (this.walkAction) this.walkAction.fadeOut(0.2);
      this.idleAction.reset().fadeIn(0.2).play();
    }
  }

  updateCoins(delta) {
    const player = this.getActivePlayer();
    if (!player) return;

    this.coins.forEach((coin) => {
      if (!coin.visible) return;

      coin.rotation.y += delta * 3;

      const distance = player.position.distanceTo(coin.position);

      if (distance < 1.4) {
        coin.visible = false;
        this.score += 1;
        this.onScoreChange(this.score);
      }
    });
  }

  updateCamera() {
    const player = this.getActivePlayer();
    if (!player) return;

    const targetPosition = new THREE.Vector3(
      player.position.x,
      10,
      player.position.z + 12
    );

    this.camera.position.lerp(targetPosition, 0.08);
    this.camera.lookAt(player.position.x, 0, player.position.z);
  }

  updateAnimations(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  update = () => {
    const delta = this.clock.getDelta();

    this.updatePlayer(delta);
    this.updateCoins(delta);
    this.updateAnimations(delta);
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);

    this.animationId = requestAnimationFrame(this.update);
  };

  handleResize = () => {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  destroy() {
    cancelAnimationFrame(this.animationId);

    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.walkAction = null;
    this.idleAction = null;

    if (this.renderer) {
      this.renderer.dispose();
      if (
        this.renderer.domElement &&
        this.container.contains(this.renderer.domElement)
      ) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
  }
}

export default CoinGame;
