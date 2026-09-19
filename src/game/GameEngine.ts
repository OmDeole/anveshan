import * as THREE from 'three';
import { SamuraiCharacter } from './SamuraiCharacter';
import { Environment, SANCTUARY_EVENTS } from './Environment';
import { InputState, SanctuaryEventId } from '../types';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Game entities
  public samurai: SamuraiCharacter;
  public environment: Environment;

  // Event Waypoint Proximity Tracking
  public onEventTriggered: ((eventId: SanctuaryEventId) => void) | null = null;
  public onNearEventChanged: ((eventId: SanctuaryEventId | null) => void) | null = null;
  public isEventModalOpen: boolean = false;
  public lastTriggeredEventId: SanctuaryEventId | null = null;
  public nearbyEventId: SanctuaryEventId | null = null;

  // Input & Physics
  private input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    moveVector: { x: 0, y: 0 },
  };

  // Character physics
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private characterPos: THREE.Vector3 = new THREE.Vector3(-2, 0.7, 4);
  private verticalVelocity: number = 0;
  private gravity: number = -22;
  private jumpForce: number = 7.5;
  private moveSpeed: number = 4.8;
  private sprintMultiplier: number = 1.65;

  // Camera settings (Elevated Third-Person Trailing View)
  // Distance from character: default 7.5, zoomable from 2.2 (close-up) to 18.0 (wide panorama)
  private cameraDistance: number = 7.2;
  private cameraPitch: number = 0.38; // Vertical tilt angle in radians
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private cameraAngleY: number = 0; // Orbit yaw offset
  private isPointerDown: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private initialPinchDist: number | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup - Field of view 55 for cinematic depth
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 800);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. World entities
    this.environment = new Environment(this.scene);
    this.samurai = new SamuraiCharacter();
    this.samurai.group.position.copy(this.characterPos);
    this.scene.add(this.samurai.group);

    // Initialize camera position behind character facing Mt Fuji
    const initOffset = this.calculateCameraOffset();
    this.currentCameraPos.copy(this.characterPos).add(initOffset);
    this.camera.position.copy(this.currentCameraPos);

    // 5. Event Listeners
    this.setupEventListeners();

    // 6. Start Loop
    this.start();
  }

  /**
   * Set inputs from React VirtualJoystick or Keyboard handlers
   */
  public updateInput(newInput: Partial<InputState>) {
    this.input = { ...this.input, ...newInput };
  }

  public setJoystickVector(x: number, y: number) {
    this.input.moveVector = { x, y };
  }

  public triggerJump() {
    if (this.samurai.isGrounded && this.verticalVelocity <= 0.1) {
      this.verticalVelocity = this.jumpForce;
      this.samurai.isGrounded = false;
    }
  }

  public setSprint(isSprinting: boolean) {
    this.input.sprint = isSprinting;
  }

  public setEventModalOpen(isOpen: boolean) {
    this.isEventModalOpen = isOpen;
    if (isOpen) {
      this.input.forward = false;
      this.input.backward = false;
      this.input.left = false;
      this.input.right = false;
      this.input.sprint = false;
      this.input.moveVector = { x: 0, y: 0 };
    }
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse / Touch orbit view (allows user to look around character smoothly)
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
  }

  private removeEventListeners() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    const dom = this.renderer.domElement;
    if (dom) {
      dom.removeEventListener('pointerdown', this.onPointerDown);
      dom.removeEventListener('wheel', this.onWheel);
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = true;
        break;
      case 'Space':
        this.triggerJump();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = false;
        break;
    }
  };

  private calculateCameraOffset(): THREE.Vector3 {
    // Spherical coordinates from cameraDistance, cameraPitch, and cameraAngleY
    const horizontalDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const heightDist = this.cameraDistance * Math.sin(this.cameraPitch) + 1.2;

    const offsetX = Math.sin(this.cameraAngleY) * horizontalDist;
    const offsetZ = Math.cos(this.cameraAngleY) * horizontalDist;
    return new THREE.Vector3(offsetX, heightDist, offsetZ);
  }

  private onPointerDown = (e: PointerEvent) => {
    // Only handle if interacting with canvas
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      this.isPointerDown = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    } else if (this.activePointers.size === 2) {
      // Begin pinch zoom tracking
      const pts = Array.from(this.activePointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      this.initialPinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two finger pinch to zoom on mobile/tablet
    if (this.activePointers.size === 2 && this.initialPinchDist !== null) {
      const pts = Array.from(this.activePointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const currentPinchDist = Math.sqrt(dx * dx + dy * dy);
      const pinchDelta = (this.initialPinchDist - currentPinchDist) * 0.025;
      this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + pinchDelta, 2.5, 16.0);
      this.initialPinchDist = currentPinchDist;
      return;
    }

    // Single finger or mouse drag to orbit yaw and pitch
    if (this.isPointerDown && this.activePointers.size === 1) {
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // Rotate camera yaw smoothly
      this.cameraAngleY -= deltaX * 0.006;
      // Adjust camera pitch (elevation angle)
      this.cameraPitch = THREE.MathUtils.clamp(
        this.cameraPitch + deltaY * 0.004,
        0.05, // low angle near floor
        1.15  // high aerial bird's eye
      );
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size === 0) {
      this.isPointerDown = false;
      this.initialPinchDist = null;
    } else if (this.activePointers.size === 1) {
      const pt = Array.from(this.activePointers.values())[0];
      this.lastPointerX = pt.x;
      this.lastPointerY = pt.y;
      this.initialPinchDist = null;
    }
  };

  private onWheel = (e: WheelEvent) => {
    // Zoom close in on the character (close third person 2.5) or pull out wide (16.0)
    const zoomDelta = e.deltaY * 0.008;
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + zoomDelta, 2.5, 16.0);
  };

  public zoomIn() {
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance - 1.6, 2.5, 16.0);
  }

  public zoomOut() {
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + 1.6, 2.5, 16.0);
  }

  public resetCameraBehind() {
    this.cameraAngleY = 0;
    this.cameraPitch = 0.38;
    this.cameraDistance = 7.2;
  }

  /**
   * Main game physics, movement, and camera update
   */
  private updatePhysics(delta: number) {
    // 1. Calculate Combined Input Direction (Keyboard + Virtual Joystick)
    let inputX = this.input.moveVector.x;
    let inputZ = -this.input.moveVector.y; // Inverted: Up joystick = negative Z (forward)

    if (this.input.left) inputX -= 1;
    if (this.input.right) inputX += 1;
    if (this.input.forward) inputZ -= 1;
    if (this.input.backward) inputZ += 1;

    // Clamp input magnitude to 1
    const rawLen = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (rawLen > 1) {
      inputX /= rawLen;
      inputZ /= rawLen;
    }

    const isMoving = rawLen > 0.05;
    const speed = (this.input.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed) * (rawLen > 1 ? 1 : rawLen);

    // 2. Camera-relative movement
    if (isMoving) {
      // Calculate angle relative to camera view
      const moveAngle = Math.atan2(inputX, inputZ) + this.cameraAngleY;
      const targetFacing = moveAngle + Math.PI; // Face forward along direction
      this.samurai.setFacingAngle(targetFacing);

      // Move in world space with boundary check
      const prevX = this.characterPos.x;
      const prevZ = this.characterPos.z;

      const moveDirX = Math.sin(moveAngle);
      const moveDirZ = Math.cos(moveAngle);

      this.characterPos.x += moveDirX * speed * delta;
      this.characterPos.z += moveDirZ * speed * delta;

      // 3. Multi-Zone Sanctuary Boundary & Collision
      // Check if candidate position is within any of the 4 interconnected spaces:
      const isInSanctuary = (x: number, z: number) => {
        // Zone 0: Central Sanctuary Courtyard (Hub)
        if (x >= -15.5 && x <= 18.5 && z >= -12.0 && z <= 12.0) return true;
        // Zone 1: West Bridge & Fuji Overlook (Tech Treasure Hunt: beacon at -32, 0)
        if (x >= -40.5 && x <= -15.0 && z >= -8.5 && z <= 8.5) return true;
        // Zone 2: South Torii Avenue & Sakura Grove (Promptify: beacon at 0, 30)
        if (x >= -9.5 && x <= 9.5 && z >= 11.5 && z <= 40.5) return true;
        // Zone 3: Pagoda Platform & East Moon Pavilion (Logic Lamps: beacon at 33, 1)
        if (x >= 2.5 && x <= 41.5 && z >= -7.5 && z <= 9.5) return true;
        return false;
      };

      if (!isInSanctuary(this.characterPos.x, this.characterPos.z)) {
        // Attempt slide on X
        if (isInSanctuary(this.characterPos.x, prevZ)) {
          this.characterPos.z = prevZ;
        } else if (isInSanctuary(prevX, this.characterPos.z)) {
          this.characterPos.x = prevX;
        } else {
          this.characterPos.x = prevX;
          this.characterPos.z = prevZ;
        }
      }
    }

    // Safety outer world clamp
    this.characterPos.x = THREE.MathUtils.clamp(this.characterPos.x, -40.5, 41.5);
    this.characterPos.z = THREE.MathUtils.clamp(this.characterPos.z, -12.0, 40.5);

    // Calculate Ground Height dynamically based on zone elevations
    let groundHeight = 0.7; // Base stone terrace height for Hub, Overlook, and Torii Grove

    // Check if on the Pagoda raised stone platform or East Moon Pavilion
    if (this.characterPos.x >= 2.5 && this.characterPos.x <= 41.5 &&
        this.characterPos.z >= -7.5 && this.characterPos.z <= 9.5) {
      if (this.characterPos.x < 3.8) {
        // On stone steps transition
        const stepProgress = (this.characterPos.x - 2.5) / 1.3;
        groundHeight = 0.7 + stepProgress * 0.8;
      } else {
        groundHeight = 1.5; // Raised Pagoda and Moon Pavilion platform deck
      }
    }

    // 4. Vertical physics / Jump & Gravity
    this.verticalVelocity += this.gravity * delta;
    this.characterPos.y += this.verticalVelocity * delta;

    if (this.characterPos.y <= groundHeight) {
      this.characterPos.y = groundHeight;
      this.verticalVelocity = 0;
      this.samurai.isGrounded = true;
    } else {
      this.samurai.isGrounded = false;
    }

    // Update samurai position
    this.samurai.group.position.copy(this.characterPos);

    // 5. Update character procedural animations
    this.samurai.update(
      delta,
      isMoving,
      speed,
      this.input.sprint,
      !this.samurai.isGrounded
    );

    // 6. Camera Tracking: Elevated Third-Person View with dynamic zoom and pitch
    // Camera smoothly follows behind samurai with soft damping (lerp)
    const cameraOffset = this.calculateCameraOffset();
    const targetCamPos = new THREE.Vector3().copy(this.characterPos).add(cameraOffset);

    // Smooth fluid lerp for cinematic camera motion
    const camLerpSpeed = 8.5 * delta;
    this.currentCameraPos.lerp(targetCamPos, Math.min(camLerpSpeed, 0.95));
    this.camera.position.copy(this.currentCameraPos);

    // Camera looks at chest height of samurai
    const targetLookAt = new THREE.Vector3(
      this.characterPos.x,
      this.characterPos.y + 1.25,
      this.characterPos.z
    );
    this.cameraLookTarget.lerp(targetLookAt, Math.min(10.0 * delta, 0.95));
    this.camera.lookAt(this.cameraLookTarget);

    // 7. Event Waypoint Proximity Detection
    let foundNearby: SanctuaryEventId | null = null;
    const triggerRadius = 2.2;
    const exitRadius = 3.2;

    for (const ev of SANCTUARY_EVENTS) {
      const dx = this.characterPos.x - ev.position.x;
      const dz = this.characterPos.z - ev.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < triggerRadius) {
        foundNearby = ev.id;
        // Trigger if not already triggered for this event and modal is not currently open
        if (this.lastTriggeredEventId !== ev.id && !this.isEventModalOpen) {
          this.lastTriggeredEventId = ev.id;
          if (this.onEventTriggered) {
            this.onEventTriggered(ev.id);
          }
        }
        break;
      }
    }

    // Reset lastTriggeredEventId when walking away from the beacon
    if (this.lastTriggeredEventId) {
      const lastEv = SANCTUARY_EVENTS.find((e) => e.id === this.lastTriggeredEventId);
      if (lastEv) {
        const dx = this.characterPos.x - lastEv.position.x;
        const dz = this.characterPos.z - lastEv.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > exitRadius) {
          this.lastTriggeredEventId = null;
        }
      }
    }

    if (foundNearby !== this.nearbyEventId) {
      this.nearbyEventId = foundNearby;
      if (this.onNearEventChanged) {
        this.onNearEventChanged(foundNearby);
      }
    }
  }

  private tick = () => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePhysics(delta);
    this.environment.update(delta);
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.removeEventListeners();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
