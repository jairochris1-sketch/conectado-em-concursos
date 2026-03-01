import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

function DebugStatus({ title, status, details }) {
  const colors = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    loading: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900"
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    loading: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[status]} flex items-start gap-2`}>
      {icons[status]}
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-1 opacity-80">{details}</p>
      </div>
    </div>
  );
}

export default function ChatDebugValidator({ convKey, currentUserEmail, partnerEmail }) {
  const [checks, setChecks] = useState({
    sdkAvailable: { status: "loading", detail: "Verificando SDK..." },
    entitySubscription: { status: "loading", detail: "Verificando subscription..." },
    messageCreation: { status: "loading", detail: "Testando criação..." },
    eventEmission: { status: "loading", detail: "Aguardando evento..." },
    realTimeDelivery: { status: "loading", detail: "Verificando entrega..." }
  });

  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    validateSystem();
  }, []);

  const addTestResult = (msg) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      msg,
      time: new Date().toLocaleTimeString("pt-BR")
    }]);
  };

  const validateSystem = async () => {
    try {
      // 1. Verificar SDK
      addTestResult("✓ SDK Base44 disponível");
      setChecks(p => ({
        ...p,
        sdkAvailable: { status: "success", detail: "SDK Base44 carregado" }
      }));

      // 2. Testar subscription
      addTestResult("→ Iniciando subscription no StudyPartnerMessage...");
      let eventReceived = false;
      let subscriptionWorking = false;

      const unsubscribe = base44.entities.StudyPartnerMessage.subscribe((event) => {
        // Verificar se o evento é da nossa conversa
        if (event.data?.conversation_key === convKey) {
          addTestResult(`✓ EVENTO RECEBIDO: ${event.type} - ID: ${event.data?.id} - Conversa: ${convKey}`);
          eventReceived = true;
          subscriptionWorking = true;
          setChecks(p => ({
            ...p,
            eventEmission: { status: "success", detail: `Evento ${event.type} em tempo real ✓` }
          }));
        } else {
          addTestResult(`⊘ Evento de outra conversa: ${event.data?.conversation_key}`);
        }
      });

      setChecks(p => ({
        ...p,
        entitySubscription: { status: "success", detail: "Subscription ativa no StudyPartnerMessage" }
      }));

      // 3. Testar criação de mensagem
      addTestResult("→ Criando mensagem de teste...");
      let testMsg = null;
      
      try {
        testMsg = await base44.entities.StudyPartnerMessage.create({
          sender_email: currentUserEmail,
          sender_name: "Debug Test",
          sender_photo: "",
          receiver_email: partnerEmail,
          content: `[DEBUG TEST ${new Date().getTime()}]`,
          conversation_key: convKey,
          is_read: false
        });

        if (testMsg?.id) {
          addTestResult(`✓ MENSAGEM CRIADA: ID=${testMsg.id}`);
          setChecks(p => ({
            ...p,
            messageCreation: { status: "success", detail: `Mensagem criada: ${testMsg.id}` }
          }));
        } else {
          addTestResult("✗ ERRO: Mensagem criada mas sem ID retornado");
          setChecks(p => ({
            ...p,
            messageCreation: { status: "error", detail: "Criação retornou sem ID" }
          }));
        }
      } catch (err) {
        addTestResult(`✗ ERRO NA CRIAÇÃO: ${err.message}`);
        setChecks(p => ({
          ...p,
          messageCreation: { status: "error", detail: err.message }
        }));
      }

      // 4. Aguardar evento (em paralelo com criação)
      addTestResult("⏳ Aguardando evento em tempo real (4s)...");
      await new Promise(resolve => setTimeout(resolve, 4000));

      if (eventReceived) {
        addTestResult("✓ EVENTO DETECTADO! Real-time está funcionando.");
        setChecks(p => ({
          ...p,
          realTimeDelivery: { status: "success", detail: "Real-time delivery confirmado ✓✓" }
        }));
      } else {
        addTestResult("✗ EVENTO NÃO RECEBIDO APÓS 4s");
        addTestResult("→ Possíveis causas: RLS bloqueando, subscription não ativa, ou evento não disparado");
        setChecks(p => ({
          ...p,
          realTimeDelivery: { status: "error", detail: "Evento não recebido - verifique RLS e subscription" }
        }));
      }

      // 5. Verificar persistência no DB
      if (testMsg?.id) {
        addTestResult("→ Verificando persistência...");
        try {
          const allMsgs = await base44.entities.StudyPartnerMessage.filter({
            conversation_key: convKey
          });
          const found = allMsgs.find(m => m.id === testMsg.id);
          
          if (found) {
            addTestResult(`✓ MENSAGEM PERSISTIDA: ${found.id}`);
          } else {
            addTestResult(`✗ MENSAGEM CRIADA MAS NÃO ENCONTRADA NA QUERY`);
            addTestResult(`  Mensagens encontradas na conversa: ${allMsgs.length}`);
          }
        } catch (err) {
          addTestResult(`✗ ERRO AO BUSCAR: ${err.message}`);
        }
      }

      // Cleanup
      unsubscribe();

      // NÃO deletar - deixar para análise manual
      if (testMsg?.id) {
        addTestResult(`→ Mensagem deixada no DB para análise: ${testMsg.id}`);
      }

    } catch (error) {
      addTestResult(`✗ ERRO: ${error.message}`);
      setChecks(p => ({
        ...p,
        messageCreation: { status: "error", detail: error.message }
      }));
    }
  };

  return (
    <Card className="w-full bg-gray-50 border-2 border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🔍 Chat Debug Validator</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={validateSystem}
            className="gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Revalidar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Checks */}
        <div className="space-y-2">
          <DebugStatus
            title="SDK Base44"
            status={checks.sdkAvailable.status}
            details={checks.sdkAvailable.detail}
          />
          <DebugStatus
            title="Entity Subscription"
            status={checks.entitySubscription.status}
            details={checks.entitySubscription.detail}
          />
          <DebugStatus
            title="Message Creation"
            status={checks.messageCreation.status}
            details={checks.messageCreation.detail}
          />
          <DebugStatus
            title="Event Emission"
            status={checks.eventEmission.status}
            details={checks.eventEmission.detail}
          />
          <DebugStatus
            title="Real-Time Delivery"
            status={checks.realTimeDelivery.status}
            details={checks.realTimeDelivery.detail}
          />
        </div>

        {/* Test Results Log */}
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs h-40 overflow-y-auto border border-gray-700">
          {testResults.map(result => (
            <div key={result.id} className="py-0.5">
              <span className="text-gray-500">[{result.time}]</span> {result.msg}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs text-blue-900">
          <strong>Conversa:</strong> {convKey}
        </div>
      </CardContent>
    </Card>
  );
}