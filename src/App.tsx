import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProposalPage from './pages/ProposalPage'
import QuestionCard from './components/QuestionCard'
import ResultsScreen from './components/ResultsScreen'
import WelcomeScreen from './components/WelcomeScreen'
import { useQuiz } from './hooks/useQuiz'
import './App.css'

const QuizHome = () => {
  const quiz = useQuiz()

  if (!quiz.hasStarted) {
    return <WelcomeScreen onStart={quiz.startQuiz} />
  }

  if (quiz.isComplete) {
    return <ResultsScreen answers={quiz.answers} onReset={quiz.resetQuiz} />
  }

  return (
    <QuestionCard
      answer={quiz.currentAnswer}
      canContinue={quiz.canContinue}
      currentIndex={quiz.currentIndex}
      direction={quiz.direction}
      progressPercent={quiz.progressPercent}
      question={quiz.currentQuestion}
      questionCount={quiz.questionCount}
      onAnswer={quiz.setAnswer}
      onBack={quiz.goBack}
      onNext={quiz.goNext}
    />
  )
}

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proposal" element={<ProposalPage />} />
        <Route path="/quiz" element={<QuizHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App