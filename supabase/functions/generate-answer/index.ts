import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_CONTEXT: Record<string, string> = {
  weather: "기상 데이터 API (날씨, 기온, 강수량, 도로 결빙 상태, 폭설, 안개 등)",
  traffic: "교통 데이터 API (실시간 교통 상황, 도로 정체, 교통 혼잡도, 소통 상태)",
  poi_crowding: "POI 혼잡도 API (장소별 혼잡도, 주차장 현황, 관광지 인파 정보)",
  incident: "유고 데이터 API (사고 정보, 도로 공사, 통제 구간, 긴급 상황)",
  hazard: "위험구간 API (도로 위험 지역, 안전 경고, 급커브, 급경사)",
  map: "지도 API (지도 표시, 위치 확인, 경로 시각화, 마커 표시)",
  route: "경로 탐색 API (최단 경로, 최적 경로, 우회 경로, 네비게이션)",
  complex: "복합 데이터 API (여러 API를 조합하여 ETA 변화 분석, 경로 추천 이유 등)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      categoryId, 
      categoryName,
      model = "google/gemini-2.5-flash",
      useCustomOpenAI = false,
      openaiApiKey 
    } = await req.json();
    
    const mcpContext = CATEGORY_CONTEXT[categoryId] || categoryName;
    
    const systemPrompt = `당신은 차량 내 AI 비서입니다. 운전자의 질문에 대해 ${mcpContext}를 활용하여 답변합니다.

규칙:
1. 실제 MCP(Model Context Protocol)를 통해 데이터를 조회한 것처럼 구체적이고 현실적인 답변을 제공하세요
2. 답변은 운전 중인 사용자를 위해 간결하고 명확해야 합니다
3. 실시간 데이터를 기반으로 한 것처럼 시간, 수치, 상황 등을 구체적으로 언급하세요
4. 필요시 추가 조치나 권장 사항도 함께 제공하세요
5. 한국어로 자연스럽게 답변하세요`;

    const userPrompt = `운전자 질문: "${query}"

위 질문에 대해 ${mcpContext}를 조회한 결과를 바탕으로 답변해주세요.`;

    let response;
    
    if (useCustomOpenAI && openaiApiKey) {
      console.log("Generating answer using custom OpenAI API key");
      
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1000,
        }),
      });
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      
      console.log(`Generating answer for query in category ${categoryId} using model: ${model}`);

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "크레딧이 부족합니다. 크레딧을 충전해주세요." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI 서비스 오류가 발생했습니다");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "답변을 생성할 수 없습니다.";

    return new Response(
      JSON.stringify({ 
        success: true, 
        answer,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-answer error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
