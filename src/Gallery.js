import { Plane } from 'ogl';
import gsap from 'gsap';

import Media from './Media';

export default class Gallery {
  constructor({ gl, scene, viewport, screen, elements, textures }) {
    this.gl = gl;
    this.scene = scene;
    this.viewport = viewport;
    this.screen = screen;
    this.elements = elements;
    this.textures = textures;

    this.galleryElement = document.querySelector('.intro__gallery');

    this.y = {
      current: 0,
      target: 0,
      position: 0,
      start: 0,
      last: 0,
      ease: 0.1,
      direction: '',
    };
    this.x = {
      current: 0,
      target: 0,
      position: 0,
      start: 0,
      last: 0,
      ease: 0.1,
      direction: '',
    };
    this.isDown = false;

    this.createGeometry();
    this.createMedias();

    this.onResize({ viewport, screen });
  }

  /**
   * OGL.
   */
  createGeometry() {
    this.geometry = new Plane(this.gl, {
      widthSegments: 16,
      heightSegments: 16,
    });
  }

  createMedias() {
    this.medias = this.elements.map(
      (element, index) =>
        new Media({
          gl: this.gl,
          scene: this.scene,
          viewport: this.viewport,
          screen: this.screen,
          geometry: this.geometry,
          element: element.querySelector('img'),
          texture: this.textures[element.dataset.src],
          index,
        })
    );
  }

  /**
   * Events.
   */
  onResize({ viewport, screen }) {
    this.viewport = viewport;
    this.screen = screen;

    const galleryHeightPx = this.galleryElement.clientHeight;
    const galleryHeightViewport =
      (galleryHeightPx / this.screen.height) * this.viewport.height;

    const galleryWidthPx = this.elements[0].clientWidth * 6;
    const galleryWidthViewport =
      (galleryWidthPx / this.screen.width) * this.viewport.width;

    if (this.medias) {
      this.medias.forEach((media) => {
        if (media && media.onResize) {
          media.onResize({
            viewport,
            screen,
            galleryHeight: galleryHeightViewport,
            galleryWidth: galleryWidthViewport,
          });
        }
      });
    }
  }

  onTouchDown(event) {
    this.isDown = true;

    this.y.position = this.y.current;
    this.y.start = event.touches ? event.touches[0].clientY : event.clientY;

    this.x.position = this.x.current;
    this.x.start = event.touches ? event.touches[0].clientX : event.clientX;
  }

  onTouchMove(event) {
    if (!this.isDown) return;

    const y = event.touches ? event.touches[0].clientY : event.clientY;
    const distanceY = (this.y.start - y) * 3;

    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const distanceX = (this.x.start - x) * 3;

    this.y.target = this.y.position + distanceY;
    this.x.target = this.x.position + distanceX;
  }

  onTouchUp() {
    this.isDown = false;
  }

  onWheel(y) {
    this.y.target += y;
  }

  onClick() {}

  /**
   * Loop.
   */
  update() {
    this.y.current = gsap.utils.interpolate(
      this.y.current,
      this.y.target,
      this.y.ease
    );

    this.x.current = gsap.utils.interpolate(
      this.x.current,
      this.x.target,
      this.x.ease
    );

    if (this.y.current > this.y.last) {
      this.y.direction = 'bottom';
    } else if (this.y.current < this.y.last) {
      this.y.direction = 'top';
    }

    if (this.x.current > this.x.last) {
      this.x.direction = 'left';
    } else if (this.x.current < this.x.last) {
      this.x.direction = 'right';
    }

    if (this.medias) {
      this.medias.forEach((media) => {
        if (media && media.update) {
          media.update({
            scrollY: this.y.current,
            directionY: this.y.direction,
            scrollX: this.x.current,
            directionX: this.x.direction,
          });
        }
      });
    }

    this.y.last = this.y.current;
    this.x.last = this.x.current;
  }
}
