// WB1: begins the WHOOP OAuth connect flow. Called by the browser (with the
// signed-in athlete's own Supabase access token) from /connections, which
// then navigates to the returned URL itself -- keeping the access token out
// of the browser's address bar/history entirely (it only ever travels in
// this fetch's Authorization header).
import { NextResponse } from "next/server";
import {
  WHOOP_AUTHORIZE_URL,
  WHOOP_SCOPES,
  resolveSessionAthleteId,
  signWhoopState,
  whoopClientId,
  whoopRedirectUri,
} from "@/lib/whoopServer";

export async function POST(request: Request) {
  try {
    const athleteId = await resolveSessionAthleteId(request);
    if (!athleteId) {
      return NextResponse.json(
        { error: "Not signed in.", code: "not_signed_in" },
        { status: 401 }
      );
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: whoopClientId(),
      redirect_uri: whoopRedirectUri(),
      scope: WHOOP_SCOPES,
      state: signWhoopState(athleteId),
    });

    return NextResponse.json({ url: `${WHOOP_AUTHORIZE_URL}?${params.toString()}` });
  } catch (error) {
    // Logged in full so the real cause shows up in Vercel runtime logs; the
    // client only ever gets a coarse, safe classification.
    console.error("WHOOP authorize failed", error);
    const misconfigured =
      error instanceof Error && error.message.startsWith("Missing required env var");
    return NextResponse.json(
      misconfigured
        ? { error: "WHOOP isn't configured on the server.", code: "server_misconfigured" }
        : { error: "Unexpected error starting WHOOP connection.", code: "unexpected" },
      { status: 500 }
    );
  }
}
