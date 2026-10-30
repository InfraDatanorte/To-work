import Icon from './Icon.jsx';

export default function HeroVisual() {
  return <div className="hero-visual" aria-hidden="true">
    <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
    <span className="visual-label"><span className="tiny-dot" /> Uma conexão. Muitas possibilidades.</span>
    <div className="visual-house"><Icon name="home" size={96} /><span className="house-spark spark-one">✦</span><span className="house-spark spark-two">✦</span></div>
    <div className="floating-service floating-electric"><span className="service-symbol tone-yellow"><Icon name="bolt" /></span><div><strong>Elétrica</strong><small>Um reparo, uma solução.</small></div></div>
    <div className="floating-service floating-clean"><span className="service-symbol tone-lilac"><Icon name="clean" /></span><div><strong>Limpeza</strong><small>Mais tempo para você.</small></div></div>
    <div className="visual-bottom"><span className="visual-check"><Icon name="check" size={18} /></span><div><strong>Menos procura. Mais solução.</strong><small>Encontre o talento perto de você.</small></div></div>
  </div>;
}
