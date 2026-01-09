import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  weather: "기상, 날씨, 강수, 기온, 도로 결빙, 폭설, 안개 등 기상 관련",
  traffic: "교통 상황, 도로 정체, 교통 혼잡, 소통 상태 관련",
  poi_crowding: "장소 혼잡도, POI 밀집도, 주차장 혼잡, 관광지 인파 관련",
  incident: "사고, 유고, 도로 공사, 통제, 긴급 상황 관련",
  hazard: "위험 구간, 도로 위험 지역, 안전 경고 관련",
  map: "지도 표시, 위치 확인, 경로 시각화 관련",
  route: "경로 탐색, 최단 경로, 우회 경로, 네비게이션 관련",
  complex: "여러 데이터를 복합적으로 활용하는 질의어 (ETA 변화 이유, 경로 추천 이유 등)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      categoryId, 
      categoryName, 
      count = 5, 
      model = "google/gemini-2.5-flash",
      useCustomOpenAI = false,
      openaiApiKey 
    } = await req.json();
    
    const categoryContext = CATEGORY_PROMPTS[categoryId] || categoryName;
    
    const systemPrompt = `당신은 AI Agent 서비스의 질의어 테스트케이스를 생성하는 전문가입니다.
사용자가 AI Agent에게 물어볼 수 있는 자연스러운 한국어 질의어를 생성합니다.

규칙:
1. 실제 사용자가 말할 법한 자연스러운 구어체를 사용하세요
2. 질의어는 짧고 명확해야 합니다
3. 다양한 표현 방식을 사용하세요 (의문문, 명령문, 요청문 등)
4. 각 질의어에 적절한 태그 2-3개를 추가하세요
5. 중복되지 않는 다양한 질의어를 생성하세요`;

    const userPrompt = `"${categoryContext}" 카테고리에 대한 질의어 ${count}개를 생성해주세요.

JSON 배열 형식으로만 응답하세요:
[
  {"text": "질의어 내용", "tags": ["태그1", "태그2"]},
  ...
]`;

    let response;
    
    if (useCustomOpenAI && openaiApiKey) {
      // Use direct OpenAI API with user's API key
      console.log(`Generating ${count} queries using custom OpenAI API key`);
      
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
          max_tokens: 2000,
        }),
      });
    } else {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      
      console.log(`Generating ${count} queries for category ${categoryId} using Lovable AI model: ${model}`);

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
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI 응답을 파싱할 수 없습니다");
    }
    
    const queries = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: queries,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-queries error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
