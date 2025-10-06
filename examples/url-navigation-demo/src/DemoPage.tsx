import React from 'react';
import { useLocation } from 'react-router-dom';
import ModalDemo from './demos/ModalDemo';
import DrawerDemo from './demos/DrawerDemo';
import TabsDemo from './demos/TabsDemo';
import StepperDemo from './demos/StepperDemo';
import AccordionDemo from './demos/AccordionDemo';
import SnackbarDemo from './demos/SnackbarDemo';

export default function DemoPage() {
  const location = useLocation();

  return (
    <div className="container">
      <h1>🎯 URL Navigation Demo</h1>
      <p className="subtitle">
        Interactive demo of all URL-based navigation components from React Proto Kit
      </p>

      <div className="url-info">
        <strong>Current URL:</strong> <code>{location.pathname + location.search}</code>
        <br />
        <small>
          Try refreshing the page or using the browser back/forward buttons to see URL persistence
          in action!
        </small>
      </div>

      {/* Modal Demo */}
      <ModalDemo />

      {/* Drawer Demo */}
      <DrawerDemo />

      {/* Tabs Demo */}
      <TabsDemo />

      {/* Stepper Demo */}
      <StepperDemo />

      {/* Accordion Demo */}
      <AccordionDemo />

      {/* Snackbar Demo */}
      <SnackbarDemo />
    </div>
  );
}
