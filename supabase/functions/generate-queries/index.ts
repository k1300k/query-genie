import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

// Allowed OpenAI models for direct API
const ALLOWED_OPENAI_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini-2025-04-14",
  "gpt-5-2025-08-07",
  "gpt-5-mini-2025-08-07",
];

// Models that require max_completion_tokens instead of max_tokens and don't support temperature
const NEWER_OPENAI_MODELS = [
  "gpt-5-2025-08-07",
  "gpt-5-mini-2025-08-07",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini-2025-04-14",
];

serve(async (req) => {
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
      geminiModel = "gemini-2.5-flash",
      openaiApiKey,
      openaiModel = "gpt-4o-mini"
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
    if (!["lovable", "gemini", "openai"].includes(provider)) {
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

    if (provider === "openai") {
      if (!openaiApiKey || typeof openaiApiKey !== "string" || openaiApiKey.length < 10) {
        return new Response(
          JSON.stringify({ error: "유효한 OpenAI API 키가 필요합니다" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!ALLOWED_OPENAI_MODELS.includes(openaiModel)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 OpenAI 모델입니다" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const categoryContext = CATEGORY_PROMPTS[categoryId] || categoryName || categoryId;
    
    const systemPrompt = `당신은 차량용 내비게이션 음성 인식 시스템의 질의어 테스트케이스를 생성하는 전문가입니다.
실제 운전자가 차량 내에서 내비게이션에게 음성으로 질문하거나 명령하는 상황을 기반으로 합니다.

배경:
- 운전 중 핸즈프리로 내비게이션과 대화하는 상황
- 실제 차량 내비게이션 사용 패턴 연구 기반
- 한국 도로 및 교통 환경에 맞는 표현

규칙:
1. 운전 중 실제로 말할 법한 자연스러운 구어체를 사용하세요 (예: "여기서 유턴 가능해?", "앞에 뭐야?")
2. 음성 인식에 적합한 짧고 명확한 질의어를 생성하세요 (보통 2-15 단어)
3. 다양한 표현 방식을 사용하세요:
   - 질문형: "~야?", "~어?", "~할까?"
   - 명령형: "~해줘", "~알려줘", "~찾아줘"
   - 확인형: "~맞아?", "~인가?"
4. 각 질의어에 관련 태그 2-3개를 추가하세요
5. 중복되지 않는 다양한 상황과 표현을 생성하세요
6. 가능한 경우, 질의어 아이디어의 출처가 될 수 있는 참고 URL을 포함하세요
   - 예: 내비게이션 관련 블로그, 자동차 커뮤니티, 교통 정보 사이트 등
   - 실제 존재하는 URL만 사용하고, 없으면 빈 문자열로 남겨두세요

실제 사용 예시:
- "집으로 가줘" / "회사 가는 길 알려줘"
- "근처 주유소 어디야?" / "화장실 있는 휴게소 찾아줘"
- "지금 몇 시에 도착해?" / "얼마나 더 가야 돼?"
- "여기 왜 막혀?" / "다른 길로 가줘"
- "앞에 과속 카메라 있어?" / "이 길 제한속도 얼마야?"`;

    const userPrompt = `"${categoryContext}" 카테고리에 대한 차량 내비게이션 음성 질의어 ${validatedCount}개를 생성해주세요.

운전자가 실제로 내비게이션에게 말하는 것처럼 자연스러운 음성 질의어를 생성해주세요.
가능한 경우 참고 출처 URL도 포함해주세요.

JSON 배열 형식으로만 응답하세요:
[
  {"text": "질의어 내용", "tags": ["태그1", "태그2"], "sourceUrl": "참고URL 또는 빈문자열"},
  ...
]`;

    let content = "";

    if (provider === "gemini") {
      // Use Gemini API directly
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      
      const response = await fetch(geminiApiUrl, {
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API error:", response.status, JSON.stringify(errorData));
        
        if (response.status === 400) {
          const errorMessage = errorData?.error?.message || "잘못된 요청입니다";
          return new Response(
            JSON.stringify({ error: `Gemini API 오류: ${errorMessage}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 401 || response.status === 403) {
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
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (provider === "openai") {
      // Use OpenAI API directly
      const isNewerModel = NEWER_OPENAI_MODELS.includes(openaiModel);
      
      const requestBody: any = {
        model: openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      };

      // Use appropriate parameters based on model version
      if (isNewerModel) {
        requestBody.max_completion_tokens = 2048;
        // Don't include temperature for newer models
      } else {
        requestBody.max_tokens = 2048;
        requestBody.temperature = 0.8;
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API error:", response.status, errorData);
        
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ error: "OpenAI API 키가 유효하지 않습니다" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "OpenAI API 요청 한도를 초과했습니다" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402 || response.status === 403) {
          return new Response(
            JSON.stringify({ error: "OpenAI API 결제 또는 권한 오류입니다" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("OpenAI API 오류가 발생했습니다");
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content || "";
    } else {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("AI 서비스 설정 오류가 발생했습니다");
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      content = data.choices?.[0]?.message?.content || "";
    }

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
