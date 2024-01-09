import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OsdViewerComponent } from './osd-viewer.component';

describe('OsdViewerComponent', () => {
  let component: OsdViewerComponent;
  let fixture: ComponentFixture<OsdViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OsdViewerComponent]
    });
    fixture = TestBed.createComponent(OsdViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
