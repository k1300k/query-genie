import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigin = Deno.env.get("ALLOWED_ORIGIN");
  const origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://supfkjngdwqltvgcaapz.lovableproject.com",
    "https://lovable.dev",
    "https://preview--supfkjngdwqltvgcaapz.lovable.app"
  ];
  if (envOrigin) origins.push(envOrigin);
  return origins;
};

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
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

// Allowed Lovable AI models for validation
const ALLOWED_LOVABLE_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

// Allowed Gemini models for direct API
const ALLOWED_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    
    // Input validation
    const { 
      categoryId, 
      categoryName, 
      count = 5, 
      model = "google/gemini-2.5-flash",
      provider = "lovable",
      geminiApiKey,
      geminiModel = "gemini-2.5-flash"
    } = body;

    // Validate categoryId
    if (!categoryId || typeof categoryId !== "string" || categoryId.length > 100) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 카테고리 ID입니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate categoryName if provided
    if (categoryName && (typeof categoryName !== "string" || categoryName.length > 200)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 카테고리 이름입니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate count
    const validatedCount = Math.min(Math.max(parseInt(String(count)) || 5, 1), 20);

    // Validate provider
    if (provider !== "lovable" && provider !== "gemini") {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 AI 제공자입니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate model based on provider
    if (provider === "lovable" && !ALLOWED_LOVABLE_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 AI 모델입니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (provider === "gemini") {
      if (!geminiApiKey || typeof geminiApiKey !== "string" || geminiApiKey.length < 10) {
        return new Response(
          JSON.stringify({ error: "유효한 Gemini API 키가 필요합니다" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!ALLOWED_GEMINI_MODELS.includes(geminiModel)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 Gemini 모델입니다" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const categoryContext = CATEGORY_PROMPTS[categoryId] || categoryName || categoryId;
    
    const systemPrompt = `당신은 AI Agent 서비스의 질의어 테스트케이스를 생성하는 전문가입니다.
사용자가 AI Agent에게 물어볼 수 있는 자연스러운 한국어 질의어를 생성합니다.

규칙:
1. 실제 사용자가 말할 법한 자연스러운 구어체를 사용하세요
2. 질의어는 짧고 명확해야 합니다
3. 다양한 표현 방식을 사용하세요 (의문문, 명령문, 요청문 등)
4. 각 질의어에 적절한 태그 2-3개를 추가하세요
5. 중복되지 않는 다양한 질의어를 생성하세요`;

    const userPrompt = `"${categoryContext}" 카테고리에 대한 질의어 ${validatedCount}개를 생성해주세요.

JSON 배열 형식으로만 응답하세요:
[
  {"text": "질의어 내용", "tags": ["태그1", "태그2"]},
  ...
]`;

    let response: Response;

    if (provider === "gemini") {
      // Use Gemini API directly
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      
      response = await fetch(geminiApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          return new Response(
            JSON.stringify({ error: "Gemini API 키가 유효하지 않습니다" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Gemini API 요청 한도를 초과했습니다" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Gemini API 오류가 발생했습니다");
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
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
    } else {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("AI 서비스 설정 오류가 발생했습니다");
      }

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
    }
  } catch (error) {
    // Log only error type, not full message or stack trace
    console.error("generate-queries: request failed");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
