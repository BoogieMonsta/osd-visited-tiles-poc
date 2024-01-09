import { AfterViewInit, Component } from '@angular/core';
import * as OpenSeadragon from 'openseadragon';
import { Rect, Viewer, Options } from 'openseadragon';
import { fromEventPattern } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

const SLIDE_URL =
  'https://tiles.dev.prma.space/fcgi-bin/iipsrv.fcgi?DeepZoom=/home/iip/slides/Breast_000A20961_0_C_0_P_HE_iSyntax_40x.isyntax.dzi';
const ZOOM_THRESHOLD = 2;
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;
const DEBOUNCE_TIME = 200;
const BLUE = '0, 0, 255';

interface Overlay {
  element: HTMLElement;
  location: Rect;
  zoomLevel: number;
}

interface OverlayInfo {
  cellKey: string;
  zoomLevel: number;
  bounds: Rect;
}

@Component({
  selector: 'app-osd-viewer',
  templateUrl: './osd-viewer.component.html',
  styleUrls: ['./osd-viewer.component.css'],
})
export class OsdViewerComponent implements AfterViewInit {
  viewer!: OpenSeadragon.Viewer;
  navigator!: OpenSeadragon.Navigator;

  zoomLevel: number = MIN_ZOOM;
  bounds: Rect = new Rect(0, 0, 0, 0);

  private cellSize = 0.01;
  private viewedCells: Set<string> = new Set();
  private overlays: Map<string, Overlay> = new Map();

  ngAfterViewInit() {
    this.initViewer();
    this.getViewedCells();
    this.getPersistedOverlays();

    this.listenToZoomAndPan();
  }

  private initViewer(): void {
    const options: Options = {
      id: 'osd-viewer',
      maxZoomLevel: MAX_ZOOM,
      defaultZoomLevel: MIN_ZOOM,
      tileSources: [SLIDE_URL],
      immediateRender: true,
      showNavigator: true,
      showNavigationControl: false,
      navigatorId: 'navigator-div',
      navigatorDisplayRegionColor: 'black',
      loadTilesWithAjax: true,
      crossOriginPolicy: 'Anonymous',
      timeout: 10000000,
      maxImageCacheCount: 100,
      imageLoaderLimit: 10000,
      ajaxWithCredentials: true,
    };
    this.viewer = new Viewer(options);
    this.navigator = this.viewer.navigator;
  }

  private getViewedCells() {
    const viewedCellsJson = localStorage.getItem('viewedCells');
    if (viewedCellsJson) {
      this.viewedCells = new Set(JSON.parse(viewedCellsJson));
    }
  }

  private getPersistedOverlays() {
    const overlaysInfoJson = localStorage.getItem('overlaysInfo');
    if (overlaysInfoJson) {
      const overlaysInfo = JSON.parse(overlaysInfoJson);
      for (const overlayInfo of overlaysInfo) {
        this.createOverlay(overlayInfo);
      }
    }
  }

  private createOverlayDiv(zoomLevel: number): HTMLElement {
    const div = document.createElement('div');
    const opacity = this.getOpacityFromZoom(zoomLevel);
    this.setColor(div, opacity);
    return div;
  }

  private setColor(div: HTMLElement, opacity: number) {
    div.style.backgroundColor = `rgba(${BLUE}, ${opacity})`;
  }

  private createOsdOverlay(
    div: HTMLElement,
    bounds: Rect
  ): OpenSeadragon.OverlayOptions {
    const overlayOptions: OpenSeadragon.OverlayOptions = {
      element: div,
      location: new OpenSeadragon.Rect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      ),
    };
    this.navigator.addOverlay(overlayOptions);
    return overlayOptions;
  }

  private getOpacityFromZoom(zoomLevel: number): number {
    return (zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  }

  private listenToZoomAndPan() {
    fromEventPattern(
      (handler) => {
        this.viewer.addHandler('zoom', handler);
        this.viewer.addHandler('pan', handler);
      },
      (handler) => {
        this.viewer.removeHandler('zoom', handler);
        this.viewer.removeHandler('pan', handler);
      }
    )
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(this.handleZoomPan.bind(this));
  }

  private addOverlayToMap(
    cellKey: string,
    overlayOptions: OpenSeadragon.OverlayOptions
  ) {
    const overlay: Overlay = {
      element: overlayOptions.element as HTMLElement,
      location: overlayOptions.location as Rect,
      zoomLevel: this.zoomLevel,
    };
    this.overlays.set(cellKey, overlay);
  }

  private handleZoomPan() {
    this.zoomLevel = this.viewer.viewport.getZoom(true);
    const bounds = this.viewer.viewport.getBounds(true);

    if (this.zoomLevel > ZOOM_THRESHOLD) {
      const cellKey = this.computeCellKey(bounds);

      if (this.viewedCells.has(cellKey)) {
        this.handleViewedCell(cellKey);
      } else {
        this.handleNewCell(cellKey, bounds);
      }
    }
  }

  private computeCellKey(bounds: Rect): string {
    const cellX = Math.floor(bounds.x / this.cellSize);
    const cellY = Math.floor(bounds.y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private handleNewCell(cellKey: string, bounds: Rect) {
    this.viewedCells.add(cellKey);

    localStorage.setItem(
      'viewedCells',
      JSON.stringify(Array.from(this.viewedCells))
    );

    const overlayInfo: OverlayInfo = {
      cellKey: cellKey,
      zoomLevel: this.zoomLevel,
      bounds: bounds,
    };

    this.createOverlay(overlayInfo, true);
  }

  private createOverlay(overlayInfo: OverlayInfo, store?: boolean) {
    const div = this.createOverlayDiv(overlayInfo.zoomLevel);
    const overlayOptions = this.createOsdOverlay(div, overlayInfo.bounds);
    this.addOverlayToMap(overlayInfo.cellKey, overlayOptions);
    if (store) this.storeOverlayInfo(overlayInfo.cellKey, overlayInfo.bounds);
  }

  private handleViewedCell(cellKey: string) {
    // If the cell has been viewed before, update the overlay opacity if the zoom level is higher
    const overlay = this.overlays.get(cellKey);
    if (overlay && this.zoomLevel > overlay.zoomLevel) {
      const newOpacity = this.getOpacityFromZoom(this.zoomLevel);
      this.setColor(overlay.element, newOpacity);
      overlay.zoomLevel = this.zoomLevel;
    }
  }

  private storeOverlayInfo(cellKey: string, bounds: Rect) {
    const overlayInfo: OverlayInfo = {
      cellKey: cellKey,
      zoomLevel: this.zoomLevel,
      bounds: bounds,
    };
    const overlaysInfo = JSON.parse(
      localStorage.getItem('overlaysInfo') ?? '[]'
    );
    overlaysInfo.push(overlayInfo);
    localStorage.setItem('overlaysInfo', JSON.stringify(overlaysInfo));
  }
}
