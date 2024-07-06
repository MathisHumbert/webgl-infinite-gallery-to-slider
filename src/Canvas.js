import { Transform, Camera, Renderer, Texture, Vec2, Raycast } from 'ogl';
import NormalizeWheel from 'normalize-wheel';
import gsap from 'gsap';

import Gallery from './Gallery';

export default class Canvas {
  constructor() {
    this.createRender();
    this.createScene();
    this.createCamera();

    this.onResize();
    this.addEventsListeners();

    this.load();

    this.mouse = new Vec2();
    this.raycast = new Raycast();
    this.index = null;
    this.downIndex = null;
    this.mode = 'gallery';

    this.galleryElement = document.querySelector('.intro__gallery');
  }

  load() {
    this.textures = {};

    this.mediaElements = [...document.querySelectorAll('media')];

    const loadTextures = this.mediaElements.map((element) => {
      return new Promise((res) => {
        const src = element.dataset.src;

        const texture = new Texture(this.gl, {
          generateMipmaps: false,
        });

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;

        img.onload = () => {
          texture.image = img;
          this.textures[src] = texture;

          res();
        };
      });
    });

    Promise.all(loadTextures).then(() => {
      document.body.classList.remove('loading');

      this.createGallery();

      this.update();
    });
  }

  /**
   * OGL.
   */
  createScene() {
    this.scene = new Transform();
  }

  createCamera() {
    this.camera = new Camera(this.gl, {
      fov: 45,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 100,
    });
    this.camera.position.z = 5;
  }

  createRender() {
    this.renderer = new Renderer({ alpha: true });
    this.gl = this.renderer.gl;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.gl.canvas);
  }

  createGallery() {
    this.gallery = new Gallery({
      gl: this.gl,
      scene: this.scene,
      viewport: this.viewport,
      screen: this.screen,
      elements: this.mediaElements,
      textures: this.textures,
    });

    this.meshes = this.gallery.medias.map((media) => media.mesh);
  }

  /**
   * Events.
   */
  onResize() {
    this.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.viewport = { width, height };

    if (this.gallery && this.gallery.onResize) {
      this.gallery.onResize({ viewport: this.viewport, screen: this.screen });
    }
  }

  onTouchDown(event) {
    if (this.gallery && this.gallery.onTouchDown) {
      this.gallery.onTouchDown(event);
    }

    if (this.index !== null) {
      this.downIndex = this.index;
    }
  }

  onTouchMove(event) {
    if (this.gallery && this.gallery.onTouchMove) {
      this.gallery.onTouchMove(event);
    }

    this.mouse.set(
      2.0 * (event.x / this.screen.width) - 1.0,
      2.0 * (1.0 - event.y / this.screen.height) - 1.0
    );

    this.raycast.castMouse(this.camera, this.mouse);

    if (this.meshes && this.meshes.length > 0) {
      const hits = this.raycast.intersectBounds(this.meshes);

      if (hits && hits.length) {
        const hit = hits[0];

        this.index = hit.index;
      } else {
        this.index = null;
      }
    }
  }

  onTouchUp() {
    if (this.gallery && this.gallery.onTouchUp) {
      this.gallery.onTouchUp();
    }

    if (this.index === this.downIndex) {
      this.onClick();
    } else {
      this.downIndex = null;
    }
  }

  onWheel(event) {
    const normalizedWheel = NormalizeWheel(event);

    if (this.gallery && this.gallery.onWheel) {
      this.gallery.onWheel(normalizedWheel.pixelY);
    }
  }

  onClick() {
    if (this.mode === 'gallery') {
      this.mode === 'slider';

      this.galleryElement.classList.add('intro__slider');

      const mediaHeight = this.mediaElements[0].clientHeight;
      const gap = this.screen.height * 0.07;

      gsap.set(this.galleryElement, {
        y:
          (mediaHeight + gap) * -this.index +
          this.screen.height / 2 -
          mediaHeight / 2,
      });

      this.gallery.onClick();
    } else {
      this.mode === 'gallery';

      this.galleryElement.classList.remove('intro__slider');

      gsap.set(this.galleryElement, { y: 0 });

      this.gallery.onClick();
    }
  }

  /**
   * Loop.
   */
  update() {
    this.gl.renderer.render({ scene: this.scene, camera: this.camera });

    if (this.gallery && this.gallery.update) {
      this.gallery.update();
    }

    window.requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Listeners.
   */
  addEventsListeners() {
    window.addEventListener('resize', this.onResize.bind(this), {
      passive: true,
    });

    window.addEventListener('mousedown', this.onTouchDown.bind(this), {
      passive: true,
    });
    window.addEventListener('mousemove', this.onTouchMove.bind(this), {
      passive: true,
    });
    window.addEventListener('mouseup', this.onTouchUp.bind(this), {
      passive: true,
    });

    window.addEventListener('touchstart', this.onTouchDown.bind(this), {
      passive: true,
    });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: true,
    });
    window.addEventListener('touchend', this.onTouchUp.bind(this), {
      passive: true,
    });

    window.addEventListener('wheel', this.onWheel.bind(this), {
      passive: true,
    });
  }
}
