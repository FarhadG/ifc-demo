import { useState } from 'react';
import Configurator from '../Configurator/Configurator.component';
import Viewer from '../Viewer/Viewer.component';
import './App.scss';

function App() {
  const [viewMode, setViewMode] = useState(true);
  return (
    <div className="App">
      <button className="view-toggle" onClick={() => setViewMode(!viewMode)}>3D</button>
      {/*<Viewer />*/}
      <div className={viewMode ? 'visible' : 'hide'}>
        <Configurator />
      </div>
      <div className={!viewMode ? 'visible' : 'hide'}>
        <Viewer />
      </div>
    </div>
  );
}

export default App;
