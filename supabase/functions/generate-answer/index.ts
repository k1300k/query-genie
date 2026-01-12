import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  // Authentication check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "인증이 필요합니다" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: "유효하지 않은 인증 토큰입니다" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub;
  console.log(`generate-answer: authenticated user ${userId}`);

  try {
    const body = await req.json();
    
    // Input validation
    const { 
      query, 
      categoryId, 
      categoryName,
      model = "google/gemini-2.5-flash",
      provider = "lovable",
      geminiApiKey,
      geminiModel = "gemini-2.5-flash",
      openaiApiKey,
      openaiModel = "gpt-4o-mini"
    } = body;

    // Validate query
    if (!query || typeof query !== "string" || query.length === 0 || query.length > 1000) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 질의어입니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    const mcpContext = CATEGORY_CONTEXT[categoryId] || categoryName || categoryId;
    
    const systemPrompt = `당신은 차량 내 AI 비서입니다. 운전자의 질문에 대해 ${mcpContext}를 활용하여 답변합니다.

규칙:
1. 실제 MCP(Model Context Protocol)를 통해 데이터를 조회한 것처럼 구체적이고 현실적인 답변을 제공하세요
2. 답변은 운전 중인 사용자를 위해 간결하고 명확해야 합니다
3. 실시간 데이터를 기반으로 한 것처럼 시간, 수치, 상황 등을 구체적으로 언급하세요
4. 필요시 추가 조치나 권장 사항도 함께 제공하세요
5. 한국어로 자연스럽게 답변하세요`;

    const userPrompt = `운전자 질문: "${query}"

위 질문에 대해 ${mcpContext}를 조회한 결과를 바탕으로 답변해주세요.`;

    let answer = "";

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
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
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
      answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";
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
        requestBody.max_completion_tokens = 1024;
        // Don't include temperature for newer models
      } else {
        requestBody.max_tokens = 1024;
        requestBody.temperature = 0.7;
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
      answer = data.choices?.[0]?.message?.content || "답변을 생성할 수 없습니다.";
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
      answer = data.choices?.[0]?.message?.content || "답변을 생성할 수 없습니다.";
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        answer,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log only error type, not full message or stack trace
    console.error("generate-answer: request failed");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
