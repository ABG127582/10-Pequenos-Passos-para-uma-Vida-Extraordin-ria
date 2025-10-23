import React, { useState, useMemo, useEffect, useRef } from "react";
import { emotionalScales } from './termometro-data';
import { Heart, Frown, Flame, AlertCircle, Zap, ThumbsDown, Info, BookOpen, TrendingUp, Activity, Calendar, BarChart3, Users, Brain, Lightbulb, AlertTriangle, User } from "lucide-react";

export function setup() {
    // React handles its own setup
}
export function show() {
    // React handles its own rendering
}

export default function EmotionalThermometer() {
  const [selectedEmotion, setSelectedEmotion] = useState("alegria");
  const [hoveredLevel, setHoveredLevel] = useState<any | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [view, setView] = useState("scale"); // scale, circumplex, comparison, assessment, bodymap
  const [showInfo, setShowInfo] = useState(false);
  const [userAssessment, setUserAssessment] = useState<any | null>(null);
  const [comparisonEmotion, setComparisonEmotion] = useState("tristeza");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const currentScale = emotionalScales[selectedEmotion];
  const Icon = currentScale.icon;

  // Circumplex plot data
  const circumplexData = useMemo(() => {
    return Object.entries(emotionalScales).map(([key, emotion]: [string, any]) => ({
      key,
      name: emotion.name,
      icon: emotion.icon,
      points: emotion.levels.map((level: any) => ({
        x: level.valence,
        y: level.arousal,
        level: level.level,
        label: level.label
      }))
    }));
  }, []);

  const renderCircumplex = () => (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Modelo Circunplexo de Russell</h2>
      <div className="relative w-full aspect-square max-w-2xl mx-auto bg-slate-900 rounded-xl p-8">
        {/* Axes */}
        <div className="absolute inset-8 flex items-center justify-center">
          <div className="absolute w-full h-0.5 bg-slate-600" />
          <div className="absolute h-full w-0.5 bg-slate-600" />
        </div>
        
        {/* Labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-purple-400 text-sm font-semibold">Alto Arousal</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-purple-400 text-sm font-semibold">Baixo Arousal</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-semibold">Valência -</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-semibold">Valência +</div>

        {/* Plot points */}
        {circumplexData.map(emotion => {
          const EmotionIcon = emotion.icon;
          return emotion.points.map((point, idx) => {
            const x = ((point.x - 1) / 9) * 100; // Scale 1-10 to 0-100%
            const y = 100 - ((point.y - 1) / 9) * 100; // Invert Y axis
            
            return (
              <button
                key={`${emotion.key}-${idx}`}
                className={`absolute w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  selectedEmotion === emotion.key && selectedLevel === point.level
                    ? 'bg-white scale-125 shadow-2xl ring-4 ring-blue-400'
                    : 'bg-slate-700 hover:bg-slate-600 hover:scale-110'
                }`}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={() => {
                  setSelectedEmotion(emotion.key);
                  setSelectedLevel(point.level);
                  setView('scale');
                }}
                title={`${emotion.name} - ${point.label}`}
                aria-label={`${emotion.name} nível ${point.level}: ${point.label}`}
              >
                <EmotionIcon className="w-4 h-4 text-white" />
              </button>
            );
          });
        })}
      </div>
      <p className="text-slate-400 text-sm mt-4 text-center">
        Clique em qualquer ponto para explorar detalhes daquela emoção e nível
      </p>
    </div>
  );

  const renderBodyMap = () => {
    const bodyData = currentScale.bodyMap;
    const selectedLevelData = hoveredLevel || (selectedLevel && currentScale.levels.find((l:any) => l.level === selectedLevel));
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Mapa Corporal de Sensações - {currentScale.name}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-xl p-8 flex items-center justify-center">
            <svg viewBox="0 0 200 400" className="w-full max-w-xs">
              {/* Head */}
              <ellipse cx="100" cy="40" rx="30" ry="35" fill={`rgba(59, 130, 246, ${bodyData.face / 100})`} stroke="#94a3b8" strokeWidth="2" />
              
              {/* Chest/Torso */}
              <rect x="60" y="80" width="80" height="100" rx="15" fill={`rgba(59, 130, 246, ${bodyData.chest / 100})`} stroke="#94a3b8" strokeWidth="2" />
              
              {/* Stomach */}
              <rect x="70" y="180" width="60" height="60" rx="10" fill={`rgba(59, 130, 246, ${bodyData.stomach / 100})`} stroke="#94a3b8" strokeWidth="2" />
              
              {/* Arms */}
              <rect x="20" y="90" width="30" height="120" rx="15" fill={`rgba(59, 130, 246, ${bodyData.arms / 100})`} stroke="#94a3b8" strokeWidth="2" />
              <rect x="150" y="90" width="30" height="120" rx="15" fill={`rgba(59, 130, 246, ${bodyData.arms / 100})`} stroke="#94a3b8" strokeWidth="2" />
              
              {/* Legs */}
              <rect x="65" y="250" width="30" height="140" rx="15" fill={`rgba(59, 130, 246, ${bodyData.legs / 100})`} stroke="#94a3b8" strokeWidth="2" />
              <rect x="105" y="250" width="30" height="140" rx="15" fill={`rgba(59, 130, 246, ${bodyData.legs / 100})`} stroke="#94a3b8" strokeWidth="2" />
            </svg>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Intensidade por Região</h3>
            {[
              { name: 'Rosto', value: bodyData.face },
              { name: 'Peito', value: bodyData.chest },
              { name: 'Estômago', value: bodyData.stomach },
              { name: 'Braços', value: bodyData.arms },
              { name: 'Pernas', value: bodyData.legs }
            ].map(region => (
              <div key={region.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{region.name}</span>
                  <span className="text-blue-400 font-semibold">{region.value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${region.value}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">Nota:</strong> Baseado em estudos de mapeamento corporal de emoções (Nummenmaa et al., 2014). 
                A intensidade representa a ativação fisiológica típica relatada em cada região corporal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssessment = () => {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-6 h-6" />
          Autoavaliação Emocional
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-3">
              Como você está se sentindo agora?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(emotionalScales).map(([key, emotion]: [string, any]) => {
                const EmotionIcon = emotion.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setUserAssessment({ ...userAssessment, emotion: key })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      userAssessment?.emotion === key
                        ? 'bg-gradient-to-br ' + emotion.color + ' text-white ring-2 ring-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <EmotionIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">{emotion.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {userAssessment?.emotion && (
            <div>
              <label className="block text-white font-semibold mb-3">
                Qual a intensidade? (Nível 1-{emotionalScales[userAssessment.emotion].levels.length})
              </label>
              <div className="flex flex-wrap gap-3">
                {emotionalScales[userAssessment.emotion].levels.map((level: any) => (
                  <button
                    key={level.level}
                    onClick={() => setUserAssessment({ ...userAssessment, level: level.level, timestamp: new Date() })}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      userAssessment?.level === level.level
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {level.level} - {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {userAssessment?.level && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border-2 border-blue-500/50">
              {(() => {
                const emotion = emotionalScales[userAssessment.emotion];
                const level = emotion.levels.find((l:any) => l.level === userAssessment.level);
                const EmotionIcon = emotion.icon;
                
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <EmotionIcon className="w-8 h-8 text-blue-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {emotion.name} - Nível {level.level}: {level.label}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Avaliado em {userAssessment.timestamp.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-950/50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          O que está acontecendo
                        </h4>
                        <p className="text-slate-300 text-sm">{level.desc}</p>
                      </div>

                      <div className="bg-slate-950/50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Exemplos comuns
                        </h4>
                        <p className="text-slate-300 text-sm">{level.examples}</p>
                      </div>

                      <div className="bg-slate-950/50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Estratégias de regulação
                        </h4>
                        <p className="text-slate-300 text-sm">{level.regulation}</p>
                      </div>

                      {level.level >= 6 && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                          <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Atenção
                          </h4>
                          <p className="text-slate-300 text-sm">
                            Você está experienciando uma emoção em nível muito intenso. 
                            Considere buscar apoio de pessoas de confiança ou profissionais de saúde mental.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setUserAssessment(null)}
                      className="mt-4 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                    >
                      Nova Avaliação
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    const emotion1 = emotionalScales[selectedEmotion];
    const emotion2 = emotionalScales[comparisonEmotion];

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Comparar Emoções</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Emoção 1</label>
              <select
                value={selectedEmotion}
                onChange={(e) => setSelectedEmotion(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg"
              >
                {Object.entries(emotionalScales).map(([key, emotion]: [string, any]) => (
                  <option key={key} value={key}>{emotion.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Emoção 2</label>
              <select
                value={comparisonEmotion}
                onChange={(e) => setComparisonEmotion(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg"
              >
                {Object.entries(emotionalScales).map(([key, emotion]: [string, any]) => (
                  <option key={key} value={key}>{emotion.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[emotion1, emotion2].map((emotion, idx) => {
            const EmotionIcon = emotion.icon;
            return (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <EmotionIcon className="w-8 h-8 text-white" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{emotion.name}</h3>
                    <p className="text-sm text-slate-400">{emotion.scientificName}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-1"><strong className="text-slate-300">Valência:</strong> {emotion.valenceBase > 5 ? 'Positiva' : 'Negativa'}</p>
                    <p className="text-slate-400"><strong className="text-slate-300">Arousal:</strong> {emotion.levels[0].arousal < 5 ? 'Baixo início' : 'Alto início'}</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-1"><strong className="text-slate-300">Função Evolutiva:</strong></p>
                    <p className="text-slate-300 text-xs leading-relaxed">{emotion.evolutionaryFunction}</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-1"><strong className="text-slate-300">Níveis:</strong></p>
                    <div className="space-y-1">
                      {emotion.levels.map((level: any) => (
                        <div key={level.level} className="text-xs text-slate-300">
                          {level.level}. {level.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScale = () => {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Icon className="w-10 h-10 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">{currentScale.name}</h2>
              <p className="text-sm text-slate-400">{currentScale.scientificName}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Valência Base:</span>
              <span className="font-semibold text-white">{currentScale.valenceBase}/10</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Arousal:</span>
              <span className="font-semibold text-white">{currentScale.levels[0].arousal} → {currentScale.levels[currentScale.levels.length - 1].arousal}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Correlatos Neurais:</strong> {currentScale.neuralCorrelates}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            <strong className="text-slate-300">Função Evolutiva:</strong> {currentScale.evolutionaryFunction}
          </p>
        </div>

        <div className="relative mb-16">
          <div className={`h-8 rounded-full bg-gradient-to-r ${currentScale.color} shadow-lg`}>
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {currentScale.levels.map((item: any, index: number) => (
                <div
                  key={item.level}
                  className="relative flex flex-col items-center"
                  style={{ 
                    left: `${(index / (currentScale.levels.length - 1)) * 100}%`,
                    position: 'absolute',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <button
                    className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
                      selectedLevel === item.level
                        ? "bg-white text-slate-900 shadow-2xl scale-125 ring-4 ring-blue-400"
                        : hoveredLevel === item
                        ? "bg-white text-slate-900 shadow-xl scale-115"
                        : "bg-white text-slate-700 shadow-lg hover:scale-110"
                    }`}
                    onMouseEnter={() => setHoveredLevel(item)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    onClick={() => setSelectedLevel(item.level)}
                    onFocus={() => setHoveredLevel(item)}
                    onBlur={() => setHoveredLevel(null)}
                    aria-label={`Nível ${item.level}: ${item.label}`}
                  >
                    {item.level}
                  </button>
                  
                  <div className="w-0.5 h-6 bg-slate-400 mt-2" />
                  <span className="text-xs text-slate-300 mt-2 font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(hoveredLevel || selectedLevel) && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border-2 border-slate-600 space-y-4">
            {(() => {
              const displayLevel = hoveredLevel || currentScale.levels.find((l:any) => l.level === selectedLevel);
              return (
                <>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Nível {displayLevel.level}: {displayLevel.label}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-semibold border border-blue-500/30">
                          Valência: {displayLevel.valence}/10
                        </span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-semibold border border-purple-500/30">
                          Arousal: {displayLevel.arousal}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Descrição Científica
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      {displayLevel.desc}
                    </p>
                    <p className="text-sm text-slate-400">
                      <strong className="text-slate-300">Neurotransmissores:</strong> {displayLevel.neurotransmitters}
                    </p>
                  </div>

                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Exemplos Práticos
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {displayLevel.examples}
                    </p>
                  </div>

                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Estratégias de Regulação Emocional
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {displayLevel.regulation}
                    </p>
                  </div>

                  {displayLevel.level >= 6 && (
                    <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Atenção Importante
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Este nível de intensidade emocional pode requerer apoio especializado. 
                        Considere conversar com um psicólogo ou psiquiatra se esta emoção persistir ou causar sofrimento significativo.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {!hoveredLevel && !selectedLevel && (
          <div className="text-center text-slate-400 py-12">
            <p className="text-lg mb-2">Explore os níveis emocionais</p>
            <p className="text-sm">Passe o mouse sobre os números ou clique para ver detalhes completos</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8" role="main">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Termômetro Emocional Científico
            </h1>
          </div>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto mb-4">
            Sistema integrado baseado em Izard (DES, 1997), Russell (Circumplex Model, 1980), Ekman (1992) e Nummenmaa (2014)
          </p>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            aria-expanded={showInfo}
          >
            <Info className="w-4 h-4" />
            {showInfo ? "Ocultar" : "Ver"} Fundamentação Teórica
          </button>
        </div>

        {/* Theoretical Info */}
        {showInfo && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 text-slate-300 text-sm leading-relaxed">
            <h3 className="text-lg font-bold text-white mb-3">Fundamentação Científica</h3>
            <div className="space-y-3">
              <p>
                <strong className="text-blue-400">Modelo Dimensional:</strong> Integra valência (prazer-desprazer) e arousal (ativação-desativação) no espaço bidimensional de Russell (1980), mapeando estados afetivos de forma contínua.
              </p>
              <p>
                <strong className="text-green-400">Emoções Discretas:</strong> Baseado na Escala de Emoções Diferenciais (DES) de Izard, identificando emoções fundamentais com substratos neurais específicos.
              </p>
              <p>
                <strong className="text-purple-400">Neurociência Afetiva:</strong> Cada emoção possui correlatos neuroanatômicos envolvendo amígdala, ínsula, córtex cingulado, córtex pré-frontal e sistemas de neurotransmissores.
              </p>
              <p>
                <strong className="text-amber-400">Sensações Corporais:</strong> Mapeamento baseado em Nummenmaa et al. (2014), que identificou padrões topográficos universais de ativação corporal para cada emoção.
              </p>
            </div>

            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Importante - Disclaimer Clínico
              </h4>
              <p className="text-sm">
                Este sistema tem propósito <strong>educacional e informativo</strong>. NÃO substitui avaliação, diagnóstico ou tratamento profissional. 
                Se você está experienciando sofrimento emocional significativo, pensamentos autodestrutivos ou sintomas persistentes, 
                <strong className="text-red-300"> busque ajuda de um psicólogo ou psiquiatra imediatamente</strong>.
              </p>
              <p className="text-sm mt-2">
                <strong>CVV - Centro de Valorização da Vida:</strong> 188 (24h, gratuito)
              </p>
            </div>

            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
              <h4 className="font-semibold text-slate-300 mb-2">Limitações do Modelo</h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Modelos dimensionais vs discretos são complementares, não excludentes</li>
                <li>Experiência emocional varia significativamente entre indivíduos e culturas</li>
                <li>Neurodivergência (autismo, TDAH) pode alterar processamento emocional</li>
                <li>Valores numéricos são aproximações baseadas em literatura, não medições individuais</li>
                <li>Comorbidades psiquiátricas modificam perfis emocionais</li>
              </ul>
            </div>
          </div>
        )}

        {/* View Selector */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'scale', label: 'Escala Graduada', icon: BarChart3 },
              { id: 'circumplex', label: 'Modelo Circunplexo', icon: Activity },
              { id: 'assessment', label: 'Autoavaliação', icon: User },
              { id: 'comparison', label: 'Comparação', icon: Users },
              { id: 'bodymap', label: 'Mapa Corporal', icon: Heart }
            ].map(viewOption => {
              const ViewIcon = viewOption.icon;
              return (
                <button
                  key={viewOption.id}
                  onClick={() => setView(viewOption.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    view === viewOption.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  aria-label={`Visualizar ${viewOption.label}`}
                >
                  <ViewIcon className="w-4 h-4" />
                  <span className="text-sm">{viewOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotion Selector - Only for scale and bodymap views */}
        {(view === 'scale' || view === 'bodymap') && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Selecione a Emoção Base</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(emotionalScales).map(([key, emotion]: [string, any]) => {
                const EmotionIcon = emotion.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedEmotion(key);
                      setSelectedLevel(null);
                      setHoveredLevel(null);
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      selectedEmotion === key
                        ? "bg-gradient-to-br " + emotion.color + " text-white shadow-xl scale-105 ring-2 ring-white/50"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:scale-105"
                    }`}
                    aria-label={`Selecionar emoção ${emotion.name}`}
                  >
                    <EmotionIcon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{emotion.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {view === 'scale' && renderScale()}
        {view === 'circumplex' && renderCircumplex()}
        {view === 'assessment' && renderAssessment()}
        {view === 'comparison' && renderComparison()}
        {view === 'bodymap' && renderBodyMap()}

        {/* Scientific References */}
        <div className="mt-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Referências Científicas Principais
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              <strong>Izard, C. E. (1991).</strong> The Psychology of Emotions. New York: Plenum Press.
            </p>
            <p>
              <strong>Russell, J. A. (1980).</strong> A circumplex model of affect. Journal of Personality and Social Psychology, 39(6), 1161-1178.
            </p>
            <p>
              <strong>Ekman, P. (1992).</strong> An argument for basic emotions. Cognition & Emotion, 6(3-4), 169-200.
            </p>
            <p>
              <strong>Panksepp, J. (1998).</strong> Affective Neuroscience: The Foundations of Human and Animal Emotions. Oxford University Press.
            </p>
            <p>
              <strong>Nummenmaa, L., Glerean, E., Hari, R., & Hietanen, J. K. (2014).</strong> Bodily maps of emotions. Proceedings of the National Academy of Sciences, 111(2), 646-651.
            </p>
            <p>
              <strong>Barrett, L. F. (2017).</strong> How Emotions Are Made: The Secret Life of the Brain. Houghton Mifflin Harcourt.
            </p>
          </div>
        </div>

        {/* Additional Educational Content */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Entendendo o Modelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Valência Emocional</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dimensão hedônica da experiência: de altamente desagradável (valência negativa, 1-4) a 
                neutra (5) a altamente agradável (valência positiva, 6-10). Reflete o "tom" da emoção.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">Arousal (Ativação)</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Nível de ativação fisiológica: de desativado/sonolento (baixo arousal, 1-4) a 
                ativado/excitado (alto arousal, 7-10). Reflete a "intensidade energética" da emoção.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">Neurotransmissores</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Mensageiros químicos cerebrais. Símbolos: ↑ (aumento), ↓ (diminuição), 
                ↑↑ (grande aumento), ↓↓ (grande diminuição). Principais: dopamina (recompensa), 
                serotonina (bem-estar), cortisol (estresse), GABA (calma).
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-amber-400 mb-2">Regulação Emocional</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Capacidade de modular intensidade, duração e expressão de emoções. Estratégias incluem: 
                reavaliação cognitiva, atenção plena, expressão adaptativa, busca de suporte e mudança de situação.
              </p>
            </div>
          </div>
        </div>

        {/* Cultural & Individual Differences Note */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Variabilidade Individual e Cultural
          </h3>
          <div className="text-sm text-slate-300 space-y-3">
            <p>
              <strong className="text-white">Diferenças Individuais:</strong> Fatores como temperamento, 
              experiências de vida, saúde mental e neurodivergência (autismo, TDAH, alexitimia) influenciam 
              significativamente como emoções são experienciadas e expressas.
            </p>
            <p>
              <strong className="text-white">Variação Cultural:</strong> Enquanto emoções básicas são universais, 
              sua expressão, valorização e regulação variam entre culturas. Algumas culturas enfatizam controle 
              emocional, outras valorizam expressão aberta.
            </p>
            <p>
              <strong className="text-white">Gênero e Socialização:</strong> Normas sociais influenciam quais 
              emoções são "aceitáveis" para diferentes grupos, afetando tanto a experiência subjetiva quanto 
              a expressão comportamental.
            </p>
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="mt-8 bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recursos de Apoio em Crise
          </h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-1">CVV - Centro de Valorização da Vida</p>
              <p>Telefone: <strong className="text-blue-400">188</strong> (24 horas, gratuito)</p>
              <p>Chat: <a href="https://www.cvv.org.br" className="text-blue-400 hover:underline">www.cvv.org.br</a></p>
              <p className="text-xs mt-2 text-slate-400">Apoio emocional e prevenção do suicídio</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-1">CAPS - Centro de Atenção Psicossocial</p>
              <p className="text-xs text-slate-400">Serviço público gratuito de saúde mental. Busque o CAPS mais próximo em sua cidade.</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-1">Emergência Psiquiátrica</p>
              <p>Em caso de risco imediato: <strong className="text-red-400">SAMU 192</strong> ou dirija-se ao pronto-socorro mais próximo</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p className="mb-2">
            Sistema desenvolvido para fins educacionais com base em literatura científica atual em neurociência afetiva e psicologia das emoções.
          </p>
          <p>
            Última atualização teórica: Outubro 2024 | Sempre consulte profissionais qualificados para questões de saúde mental
          </p>
        </div>
      </div>
    </div>
  );
}