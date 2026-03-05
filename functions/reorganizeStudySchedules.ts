import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayStr = today.toISOString().split('T')[0];

        // Busca todas as tarefas não concluídas (pode precisar de paginação se houver muitas)
        // Para garantir, vamos pegar um lote grande ou o ideal seria filtrar por data, 
        // mas como não temos operador < direto no filtro simples, pegamos as não concluídas.
        const allUncompletedTasks = await base44.asServiceRole.entities.DailyStudyTask.filter({ completed: false }, null, 10000);
        
        // Agrupa por usuário
        const tasksByUser = {};
        for (const task of allUncompletedTasks) {
            if (!tasksByUser[task.user_email]) {
                tasksByUser[task.user_email] = [];
            }
            tasksByUser[task.user_email].push(task);
        }

        const updatePromises = [];
        
        for (const [email, userTasks] of Object.entries(tasksByUser)) {
            // Verifica se o usuário tem tarefas atrasadas
            const pastUncompleted = userTasks.filter(t => t.date < todayStr);
            if (pastUncompleted.length === 0) continue; 
            
            // Busca as configurações do usuário
            const users = await base44.asServiceRole.entities.User.filter({ email });
            if (users.length === 0) continue;
            const user = users[0];
            const settings = user.daily_study_settings || { days_of_week: [1,2,3,4,5], tasks_per_day: 2 };
            
            // Reorganiza todas as tarefas não concluídas a partir de hoje
            const sortedTasks = userTasks.sort((a,b) => a.date.localeCompare(b.date) || a.order - b.order);
            const daysOfWeek = settings.days_of_week;
            const tasksPerDay = settings.tasks_per_day;

            let currentDate = new Date(today);
            let tasksAssignedToday = 0;

            for (const task of sortedTasks) {
                while (!daysOfWeek.includes(currentDate.getDay()) || tasksAssignedToday >= tasksPerDay) {
                    if (tasksAssignedToday >= tasksPerDay) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        tasksAssignedToday = 0;
                    } else if (!daysOfWeek.includes(currentDate.getDay())) {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }

                const newDateStr = currentDate.toISOString().split('T')[0];
                if (task.date !== newDateStr) {
                    // Prepara atualização
                    updatePromises.push(
                        base44.asServiceRole.entities.DailyStudyTask.update(task.id, { date: newDateStr })
                    );
                }
                tasksAssignedToday++;
            }
        }
        
        // Executa todas as atualizações
        await Promise.all(updatePromises);

        return Response.json({ success: true, updated_count: updatePromises.length });
    } catch (error) {
         console.error('Erro na reorganização:', error);
         return Response.json({ error: error.message }, { status: 500 });
    }
});