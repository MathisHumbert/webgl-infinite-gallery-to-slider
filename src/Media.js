import { Mesh, Program, Vec2 } from 'ogl';

export default class Media {
  constructor({
    gl,
    scene,
    viewport,
    screen,
    geometry,
    element,
    texture,
    index,
  }) {
    this.gl = gl;
    this.scene = scene;
    this.viewport = viewport;
    this.screen = screen;
    this.geometry = geometry;
    this.element = element;
    this.texture = texture;
    this.index = index;

    this.imgElement = element.querySelector('img');
    this.scroll = { x: 0, y: 0 };
    this.extra = { x: 0, y: 0 };

    this.createMaterial();
    this.createMesh();

    this.onResize({ screen: this.screen, viewport: this.viewport });
  }

  /**
   * OGL.
   */
  createMaterial() {
    this.material = new Program(this.gl, {
      uniforms: {
        uTexture: { value: this.texture },
        uPlaneSize: { value: new Vec2(0) },
        uImageSize: {
          value: new Vec2(
            this.texture.image.naturalWidth,
            this.texture.image.naturalHeight
          ),
        },
      },
      vertex: /*glsl*/ `
        attribute vec3 position;
        attribute vec2 uv;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;

        varying vec2 vUv;

        void main(){
          vUv = uv;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
      `,
      fragment: /*glsl*/ `
        precision highp float;

        uniform sampler2D uTexture;
        uniform vec2 uPlaneSize;
        uniform vec2 uImageSize;

        varying vec2 vUv;

        vec2 getCorrectUv (vec2 planeSize, vec2 imageSize){
          vec2 ratio = vec2(
            min((planeSize.x / planeSize.y) / (imageSize.x / imageSize.y), 1.0),
            min((planeSize.y / planeSize.x) / (imageSize.y / imageSize.x), 1.0)
          );

          return vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
        }

        void main(){
          vec2 uv = getCorrectUv(uPlaneSize, uImageSize);

          vec4 texture = texture2D(uTexture, uv);

          gl_FragColor = texture;
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
  }

  createMesh() {
    this.mesh = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.material,
    });
    this.mesh.index = this.index;
    this.mesh.setParent(this.scene);
  }

  /**
   * Animations.
   */

  /**
   * Update.
   */
  createBounds() {
    const rect = this.element.getBoundingClientRect();

    this.bounds = {
      top: rect.top + this.scroll.y,
      left: rect.left + this.scroll.x,
      width: rect.width,
      height: rect.height,
    };

    this.updateScale();
    this.updateX(this.scroll.x);
    this.updateY(this.scroll.y);
  }

  updateScale() {
    this.mesh.scale.x =
      (this.viewport.width * this.bounds.width) / this.screen.width;
    this.mesh.scale.y =
      (this.viewport.height * this.bounds.height) / this.screen.height;

    this.material.uniforms.uPlaneSize.value = new Vec2(
      this.mesh.scale.x,
      this.mesh.scale.y
    );
  }

  updateX(x = 0) {
    this.mesh.position.x =
      -this.viewport.width / 2 +
      this.mesh.scale.x / 2 +
      ((this.bounds.left - x) / this.screen.width) * this.viewport.width +
      this.extra.x;
  }

  updateY(y = 0) {
    this.mesh.position.y =
      this.viewport.height / 2 -
      this.mesh.scale.y / 2 -
      ((this.bounds.top - y) / this.screen.height) * this.viewport.height +
      this.extra.y;
  }

  /**
   * Events.
   */
  onResize({ screen, viewport, galleryHeight, galleryWidth }) {
    this.screen = screen;
    this.viewport = viewport;
    this.galleryHeight = galleryHeight;
    this.galleryWidth = galleryWidth;

    this.extra = { x: 0, y: 0 };

    this.createBounds();
  }

  /**
   * Loop.
   */
  update({ scrollY, directionY, scrollX, directionX }) {
    this.scroll.y = scrollY;
    this.scroll.x = scrollX;

    this.updateY(scrollY);
    this.updateX(scrollX);

    const viewportOffsetY = this.viewport.height / 2;
    const planeOffsetY = this.mesh.scale.y / 2;

    const viewportOffsetX = this.viewport.width / 2;
    const planeOffsetX = this.mesh.scale.x / 2;

    if (
      directionY === 'top' &&
      this.mesh.position.y + planeOffsetY < -viewportOffsetY
    ) {
      this.extra.y += this.galleryHeight;
    } else if (
      directionY === 'bottom' &&
      this.mesh.position.y - planeOffsetY > viewportOffsetY
    ) {
      this.extra.y -= this.galleryHeight;
    }

    if (
      directionX === 'left' &&
      this.mesh.position.x + planeOffsetX < -viewportOffsetX
    ) {
      this.extra.x += this.galleryWidth;
    } else if (
      directionX === 'right' &&
      this.mesh.position.x - planeOffsetX > viewportOffsetX
    ) {
      this.extra.x -= this.galleryWidth;
    }
  }
}
