import { useState } from 'react';
import Configurator from '../Configurator/Configurator.component';
import Viewer from '../Viewer/Viewer.component';
import './App.scss';
import { FormControlLabel, Switch } from '@mui/material';

function App() {
  const [viewMode, setViewMode] = useState(true);
  return (
    <div className="App">
      {/*<FormControlLabel*/}
      {/*  label="3D"*/}
      {/*  className="view-toggle"*/}
      {/*  onClick={() => setViewMode(!viewMode)}*/}
      {/*  control={<Switch />}*/}
      {/*/>*/}

      {/*<div className={viewMode ? 'visible' : 'hide'}>*/}
      {/*  <Configurator />*/}
      {/*</div>*/}

      {/*<div className={!viewMode ? 'visible' : 'hide'}>*/}
      {/*  <Viewer />*/}
      {/*</div>*/}

      <Viewer />
    </div>
  );
}

export default App;
