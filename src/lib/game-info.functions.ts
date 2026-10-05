import { createServerFn } from "@tanstack/react-start";
import gameInfo from "@/data/game-info.json";

export type GameInfo = {
  title: string;
  status: string;
  game_link: string | null;
  description: string;
  updated_at: string;
};

export const getGameInfo = createServerFn({ method: "GET" }).handler(async (): Promise<GameInfo> => {
  return gameInfo;
});
