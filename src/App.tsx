import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/common/Sidebar.js';
import { Header } from './components/common/Header.js';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard.js';
import { HealthView } from './components/health/HealthView.js';
import { LearningView } from './components/learning/LearningView.js';
import { WorkView } from './components/work/WorkView.js';
import { FinanceView } from './components/finance/FinanceView.js';
import { AIChatView } from './components/chat/AIChatView.js';
import { AISettingsView } from './components/settings/AISettingsView.js';
import { ApiService } from './services/api.js';
import { AIPersonalityId, TaskItem, HealthRecord } from './types/index.js';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [currentPersonalityId, setCurrentPersonalityId] = useState<AIPersonalityId>('standard');
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [zaloLinked, setZaloLinked] = useState<boolean>(false);
  const [chatPrompt, setChatPrompt] = useState<string>('');

  // Domain data
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [dailyBriefing, setDailyBriefing] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        profileRes,
        persRes,
        tasksRes,
        healthRes,
        txRes,
        budgetsRes,
        walletsRes,
        briefingRes,
        zaloRes
      ] = await Promise.all([
        ApiService.getUserProfile(),
        ApiService.getPersonalities(),
        ApiService.getTasks(),
        ApiService.getHealthRecords(),
        ApiService.getTransactions(),
        ApiService.getBudgets(),
        ApiService.getWallets(),
        ApiService.getDailyBriefing(),
        ApiService.getZaloStatus()
      ]);

      if (profileRes) {
        setZaloLinked(!!profileRes.zaloLinked);
      }
      if (persRes?.presets) {
        setPersonalities(persRes.presets);
      }
      if (tasksRes) setTasks(tasksRes);
      if (healthRes) setHealthRecords(healthRes);
      if (txRes) setTransactions(txRes);
      if (budgetsRes) setBudgets(budgetsRes);
      if (walletsRes) setWallets(walletsRes);
      if (briefingRes) setDailyBriefing(briefingRes);
      if (zaloRes) setZaloLinked(zaloRes.linked);
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  };

  // Aggregated metrics
  const today = new Date().toISOString().split('T')[0];
  const waterIntakeMl = healthRecords
    .filter(h => h.kind === 'water' && h.timestamp.startsWith(today))
    .reduce((sum, h) => sum + (h.data.waterMl || 0), 0);

  const todayWeight = healthRecords.find(h => h.kind === 'weight')?.data.weightKg || 65;

  const totalCalories = healthRecords
    .filter(h => h.kind === 'meal' && h.timestamp.startsWith(today))
    .reduce((sum, h) => sum + (h.data.calories || 0), 0);

  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);

  // Handlers
  const handleAddWater = async (ml: number) => {
    const res = await ApiService.logHealth('water', { waterMl: ml });
    if (res) {
      setHealthRecords(prev => [res, ...prev]);
    }
  };

  const handleUpdateWeight = async (kg: number) => {
    const res = await ApiService.logHealth('weight', { weightKg: kg, bmi: 21.5 });
    if (res) {
      setHealthRecords(prev => [res, ...prev]);
    }
  };

  const handleAddTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    const res = await ApiService.createTask({ title, priority });
    if (res) {
      setTasks(prev => [res, ...prev]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = await ApiService.updateTask(taskId, { status: nextStatus });
    if (updated) {
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    }
  };

  const handleAddTransaction = async (tx: any) => {
    const res = await ApiService.addTransaction(tx);
    if (res) {
      setTransactions(prev => [res, ...prev]);
      // reload budgets and wallets
      const [bRes, wRes] = await Promise.all([ApiService.getBudgets(), ApiService.getWallets()]);
      if (bRes) setBudgets(bRes);
      if (wRes) setWallets(wRes);
    }
  };

  const handleOpenChatWithPrompt = (prompt: string) => {
    setChatPrompt(prompt);
    setCurrentTab('chat');
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 'Tổng quan Cuộc sống';
      case 'health':
        return 'Sức khỏe & Dinh dưỡng';
      case 'learning':
        return 'Học tập & Kỹ năng';
      case 'work':
        return 'Công việc & Nhiệm vụ';
      case 'finance':
        return 'Tài chính Cá nhân';
      case 'chat':
        return 'Trợ lý AI Trực tuyến';
      case 'settings':
        return 'Cài đặt Hệ thống & AI';
      default:
        return 'OmniPlan';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7f6', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* 1. Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenChat={() => setCurrentTab('chat')}
      />

      {/* 2. Main Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Header */}
        <Header
          currentTabLabel={getTabLabel(currentTab)}
          onOpenChat={() => setCurrentTab('chat')}
          onOpenZaloModal={() => setCurrentTab('settings')}
          zaloLinked={zaloLinked}
        />

        {/* Dynamic View Content */}
        <main style={{ flex: 1 }}>
          {currentTab === 'overview' && (
            <OverviewDashboard
              dailyBriefing={dailyBriefing}
              waterIntakeMl={waterIntakeMl}
              totalCalories={totalCalories}
              todayExpense={todayExpense}
              tasksCount={tasks.filter(t => t.status !== 'done').length}
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'health' && (
            <HealthView
              waterMl={waterIntakeMl}
              onAddWater={handleAddWater}
              weightKg={todayWeight}
              onUpdateWeight={handleUpdateWeight}
            />
          )}

          {currentTab === 'learning' && <LearningView />}

          {currentTab === 'work' && (
            <WorkView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              transactions={transactions}
              budgets={budgets}
              wallets={wallets}
              onAddTransaction={handleAddTransaction}
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
            />
          )}

          {currentTab === 'chat' && (
            <AIChatView
              currentPersonalityId={currentPersonalityId}
              onChangePersonality={(id) => setCurrentPersonalityId(id)}
              personalities={personalities}
              onActionExecuted={loadAllData}
              initialPrompt={chatPrompt}
              onClearInitialPrompt={() => setChatPrompt('')}
            />
          )}

          {currentTab === 'settings' && (
            <AISettingsView
              currentPersonalityId={currentPersonalityId}
              onChangePersonality={(id) => setCurrentPersonalityId(id)}
              personalities={personalities}
              zaloLinked={zaloLinked}
              onZaloLinkStatusChange={loadAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
};
