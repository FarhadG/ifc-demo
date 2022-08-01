import { useState } from 'react';
import { Stack, Switch, Typography } from '@mui/material';

import Configurator from '../Configurator/Configurator.component';
import Viewer from '../Viewer/Viewer.component';
import './App.scss';

const URL = 'https://visualize.mybuild.wtsparadigm.com/?clientId=979326c6-bbcf-4a0f-a749-4c2e718ce7bb&templateId=9de4e2c9-1bf3-48c1-a196-8b9b48a5a797';

function App() {
  const [realisticMode, setViewMode] = useState(true);
  return (
    <div className="App">
      <Stack direction="row" className="view-toggle" spacing={1} alignItems="center">
        <Typography>Realistic</Typography>
        <Switch onClick={() => setViewMode(!realisticMode)} />
        <Typography>Frame</Typography>
      </Stack>

      <div className={viewMode ? 'visible' : 'hide'}>
        <Configurator url={URL} />
      </div>

      <div className={!viewMode ? 'visible' : 'hide'}>
        <Viewer />
      </div>
    </div>
  );
}

export default App;
