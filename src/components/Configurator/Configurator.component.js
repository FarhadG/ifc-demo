import './Configurator.scss';

function Configurator({ url }) {
  return (
    <div className="Configurator">
      <iframe src={url} />
    </div>
  );
}

export default Configurator;
