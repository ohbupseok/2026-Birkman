/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserAnswer, BirkmanResult } from "../lib/schemas";
import { EXAMPLE_TEAM_DATA } from "../constants";

interface BirkmanState {
  // Survey Progress
  currentStep: number;
  answers: Record<number, number>; // questionId -> value
  responseTimes: Record<number, number>; // questionId -> ms
  isSurveyActive: boolean;
  surveyor: { name: string; role: string };
  
  // AI Config
  aiConfig: {
    provider: 'gemini' | 'openai' | 'anthropic';
    apiKey: string;
    model: string;
  };
  
  // Historical Results (Team Data)
  results: BirkmanResult[];
  individualReports: Record<string, string>; // memberName/Id -> report content
  
  loadSampleData: () => void;
  
  pauseSurvey: () => void;
  resumeSurvey: () => void;
  
  // Actions
  startSurvey: (name: string, role: string) => void;
  setAnswer: (questionId: number, value: number, timeMs: number) => void;
  setAIConfig: (config: { provider: 'gemini' | 'openai' | 'anthropic', apiKey: string, model: string }) => void;
  prevStep: () => void;
  nextStep: () => void;
  finishSurvey: (result: BirkmanResult) => void;
  resetSurvey: () => void;
  removeResult: (timestamp: number) => void;
  clearAll: () => void;
  setIndividualReport: (memberId: string, report: string) => void;
}

export const useBirkmanStore = create<BirkmanState>()(
  persist(
    (set) => ({
      currentStep: 0,
      answers: {},
      responseTimes: {},
      isSurveyActive: false,
      surveyor: { name: "", role: "" },
      aiConfig: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-2.5-flash'
      },
      results: [],
      individualReports: {},

      loadSampleData: () => set({ 
        results: [EXAMPLE_TEAM_DATA[0]].map(member => ({
          id: Math.random(),
          name: member.name,
          role: member.role || "",
          scores: member.scores,
          primaryColor: member.primaryColor || "blue",
          timestamp: Date.now()
        }))
      }),

      startSurvey: (name, role) => set({ 
        isSurveyActive: true, 
        currentStep: 0, 
        answers: {}, 
        responseTimes: {},
        surveyor: { name, role } 
      }),

      pauseSurvey: () => set({ 
        isSurveyActive: false 
      }),

      resumeSurvey: () => set({ 
        isSurveyActive: true 
      }),

      setAnswer: (questionId, value, timeMs) => set((state) => ({
        answers: { ...state.answers, [questionId]: value },
        responseTimes: { ...state.responseTimes, [questionId]: timeMs }
      })),

      setAIConfig: (aiConfig) => set({ aiConfig }),

      prevStep: () => set((state) => ({ 
        currentStep: Math.max(0, state.currentStep - 1) 
      })),

      nextStep: () => set((state) => ({ 
        currentStep: state.currentStep + 1 
      })),

      finishSurvey: (result) => set((state) => ({
        results: [result], // Only keep the latest result
        isSurveyActive: false,
        currentStep: 0,
        answers: {},
        responseTimes: {},
        surveyor: { name: "", role: "" }
      })),

      resetSurvey: () => set({ 
        isSurveyActive: false, 
        currentStep: 0, 
        answers: {},
        responseTimes: {},
        surveyor: { name: "", role: "" }
      }),

      removeResult: (timestamp) => set((state) => ({
        results: state.results.filter(r => r.timestamp !== timestamp),
        individualReports: Object.fromEntries(
          Object.entries(state.individualReports).filter(([k]) => !k.includes(String(timestamp)))
        )
      })),

      clearAll: () => set({ results: [], individualReports: {} }),

      setIndividualReport: (memberId, report) => set((state) => ({
        individualReports: { ...state.individualReports, [memberId]: report }
      }))
    }),
    {
      name: "birkman-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
