import { useCallback, useState } from 'react'
import { questions } from '../data/questions'
import type { AnswerMap, AnswerValue } from '../types/quiz'

const choiceLabels: Record<AnswerValue['choice'], string> = {
  yes: 'YES',
  no: 'NO',
  custom: 'Custom Answer',
}

export const isQuestionAnswered = (answer: AnswerValue | undefined) => {
  if (!answer) {
    return false
  }

  if (answer.choice === 'custom') {
    return Boolean(answer.customText?.trim())
  }

  return answer.choice === 'yes' || answer.choice === 'no'
}

export const getAnswerLabel = (answer: AnswerValue | undefined) => {
  if (!answer) {
    return 'Not answered yet'
  }

  if (answer.choice === 'custom') {
    const customText = answer.customText?.trim()
    return customText ? `${choiceLabels.custom}: ${customText}` : choiceLabels.custom
  }

  return choiceLabels[answer.choice]
}

export const useQuiz = () => {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion.id]
  const canContinue = isQuestionAnswered(currentAnswer)
  const progressPercent = isComplete
    ? 100
    : Math.round(((currentIndex + (canContinue ? 1 : 0.35)) / questions.length) * 100)

  const setAnswer = useCallback((questionId: string, answer: AnswerValue) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }))
  }, [])

  const goNext = useCallback(() => {
    if (!isQuestionAnswered(answers[currentQuestion.id])) {
      return
    }

    setDirection(1)

    if (currentIndex === questions.length - 1) {
      setIsComplete(true)
      return
    }

    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
  }, [answers, currentIndex, currentQuestion])

  const goBack = useCallback(() => {
    setDirection(-1)

    if (isComplete) {
      setIsComplete(false)
      return
    }

    setCurrentIndex((index) => Math.max(index - 1, 0))
  }, [isComplete])

  const startQuiz = useCallback(() => {
    setHasStarted(true)
  }, [])

  const resetQuiz = useCallback(() => {
    setAnswers({})
    setCurrentIndex(0)
    setDirection(-1)
    setHasStarted(false)
    setIsComplete(false)
  }, [])

  return {
    answers,
    canContinue,
    currentAnswer,
    currentIndex,
    currentQuestion,
    direction,
    hasStarted,
    isComplete,
    progressPercent,
    questionCount: questions.length,
    goBack,
    goNext,
    resetQuiz,
    setAnswer,
    startQuiz,
  }
}