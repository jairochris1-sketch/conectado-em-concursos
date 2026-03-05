import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const calculatePoints = (correct, total) => {
  const accuracy = total > 0 ? correct / total : 0;
  return Math.round(correct * 10 + accuracy * 500 + total * 2);
};

const calculateStreak = (answers) => {
  if (!answers || answers.length === 0) return 0;
  
  const uniqueDates = [...new Set(
    answers.map(a => {
      const date = new Date(a.created_date);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  )].sort((a, b) => b - a);

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  const mostRecentDate = uniqueDates[0];
  if (mostRecentDate !== todayTime && mostRecentDate !== yesterdayTime) {
    return 0;
  }

  let checkDate = mostRecentDate === todayTime ? todayTime : yesterdayTime;
  
  for (const dateTime of uniqueDates) {
    if (dateTime === checkDate) {
      streak++;
      checkDate = checkDate - (24 * 60 * 60 * 1000);
    } else if (dateTime < checkDate) {
      break;
    }
  }
  
  return streak;
};

const getBadges = (points, correct, total) => {
  const badges = [];
  if (correct >= 100) badges.push("Acertador");
  if (correct >= 500) badges.push("Expert");
  if (total >= 1000) badges.push("Dedicado");
  if (points >= 5000) badges.push("Mestre");
  return badges;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let user_email = payload.user_email;
    
    // Suporte para a automação de entidade (quando uma nova resposta é criada)
    if (!user_email && payload.event && payload.event.entity_name) {
      if (payload.data && payload.data.created_by) {
        user_email = payload.data.created_by;
      } else if (payload.payload_too_large) {
        try {
          const entityData = await base44.asServiceRole.entities[payload.event.entity_name].get(payload.event.entity_id);
          if (entityData) user_email = entityData.created_by;
        } catch (e) {
          console.error("Erro ao buscar entidade", e);
        }
      }
    }

    if (!user_email) {
      return Response.json({ error: 'user_email é obrigatório' }, { status: 400 });
    }

    // Buscar todas as respostas do usuário
    const userAnswers = await base44.asServiceRole.entities.UserAnswer.filter({ created_by: user_email });
    
    const totalQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter(a => a.is_correct).length;
    const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const totalPoints = calculatePoints(correctAnswers, totalQuestions);
    const streakDays = calculateStreak(userAnswers);
    const level = Math.floor(totalPoints / 1000) + 1;
    const badges = getBadges(totalPoints, correctAnswers, totalQuestions);

    // Contar questões de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAnswers = userAnswers.filter(a => {
      const answerDate = new Date(a.created_date);
      answerDate.setHours(0, 0, 0, 0);
      return answerDate.getTime() === today.getTime();
    });

    const statsData = {
      user_email,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy_rate: accuracyRate,
      streak_days: streakDays,
      total_points: totalPoints,
      level,
      badges,
      today_questions: todayAnswers.length,
      last_activity_date: userAnswers.length > 0 ? new Date(Math.max(...userAnswers.map(a => new Date(a.created_date)))).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };

    // Verificar se já existe um registro de estatísticas
    const existingStats = await base44.asServiceRole.entities.UserStats.filter({ user_email });

    if (existingStats.length > 0) {
      await base44.asServiceRole.entities.UserStats.update(existingStats[0].id, statsData);
    } else {
      await base44.asServiceRole.entities.UserStats.create(statsData);
    }

    // Atualizar também o UserRanking
    const userRanking = await base44.asServiceRole.entities.UserRanking.filter({ created_by: user_email });
    const user = await base44.asServiceRole.entities.User.filter({ email: user_email });
    
    const rankingData = {
      user_name: user[0]?.full_name || "Usuário",
      profile_photo_url: user[0]?.profile_photo_url,
      total_points: totalPoints,
      questions_answered: totalQuestions,
      correct_answers: correctAnswers,
      streak_days: streakDays,
      level,
      badges
    };

    if (userRanking.length > 0) {
      await base44.asServiceRole.entities.UserRanking.update(userRanking[0].id, rankingData);
    } else {
      await base44.asServiceRole.entities.UserRanking.create(rankingData);
    }

    return Response.json({ 
      success: true, 
      stats: statsData 
    });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});