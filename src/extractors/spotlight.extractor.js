import axios from "axios";
import * as cheerio from "cheerio";
import { v1_base_url } from "../utils/base_v1.js";

async function extractSpotlights() {
  try {
    const resp = await axios.get(`https://${v1_base_url}/home`);
    const $ = cheerio.load(resp.data);
    const slideElements = $(
      "div.deslide-wrap > div.container > div#slider > div.swiper-wrapper > div.swiper-slide"
    );

    const promises = slideElements
      .map(async (ind, ele) => {
        const poster = $(ele)
          .find(
            "div.deslide-item > div.deslide-cover > div.deslide-cover-img > img.film-poster-img"
          )
          .attr("data-src");

        const title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .text()
          .trim();

        const japanese_title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .attr("data-jname")
          .trim();

        const description = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-description"
          )
          .text()
          .trim();

        const id = $(ele)
          .find(
            ".deslide-item > .deslide-item-content > .desi-buttons > a:eq(0)"
          )
          .attr("href")
          .split("/")
          .pop();

        const data_id = $(ele)
          .find(
            ".deslide-item > .deslide-item-content > .desi-buttons > a:eq(0)"
          )
          .attr("href")
          .split("/")
          .pop()
          .split("-")
          .pop();

        const tvInfo = {};

        $(ele).find("div.sc-detail > div.scd-item").each((index, element) => {
          const tickContainer = $(element).find(".tick");

          // episodeInfo — detected by presence of .tick container
          if (tickContainer.length > 0) {
            tvInfo.episodeInfo = {
              sub: tickContainer.find(".tick-sub").text().trim().replace(/\D/g, ""),
              dub: tickContainer.find(".tick-dub").text().trim().replace(/\D/g, ""),
            };
            return;
          }

          const text = $(element)
            .text()
            .trim()
            .replace(/\n/g, "")
            .replace(/\s+/g, " ");

          // quality — detected by known quality keywords
          if (/^(HD|SD|CAM|HDRip|DVDRip)$/i.test(text)) {
            tvInfo.quality = text;
            return;
          }

          // duration — detected by "m" suffix like "24m"
          if (/^\d+m$/.test(text)) {
            tvInfo.duration = text;
            return;
          }

          // releaseDate — detected by month name
          if (/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(text)) {
            tvInfo.releaseDate = text;
            return;
          }

          // showType — everything else (TV, Movie, OVA, etc.)
          if (!tvInfo.showType) {
            tvInfo.showType = text;
          }
        });

        return {
          id,
          data_id,
          poster,
          title,
          japanese_title,
          description,
          tvInfo,
        };
      })
      .get();

    const serverData = await Promise.all(promises);
    return JSON.parse(JSON.stringify(serverData, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return error;
  }
}

export default extractSpotlights;
