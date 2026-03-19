import axios from "axios";
import * as cheerio from "cheerio";
import { v1_base_url } from "../utils/base_v1.js";

async function extractSpotlights() {
  try {
    const resp = await axios.get(`https://${v1_base_url}/home`);
    const $ = cheerio.load(resp.data);

    const slideElements = $(
      "div.deslide-wrap > div.container > div#slider > div.swiper-wrapper > div.swiper-slide:not(.swiper-slide-duplicate)"
    );

    const promises = slideElements
      .map(async (ind, ele) => {
        const poster = $(ele)
          .find("div.deslide-cover div.deslide-cover-img img.film-poster-img")
          .attr("data-src");

        const titleEl = $(ele).find("div.deslide-item-content div.desi-head-title");
        const title = titleEl.text().trim();
        const japanese_title = titleEl.attr("data-jname")?.trim() ?? "";

        const description = $(ele)
          .find("div.deslide-item-content div.desi-description")
          .text()
          .trim();

        const watchHref = $(ele)
          .find(".desi-buttons > a:eq(0)")
          .attr("href") ?? "";

        const id = watchHref.replace("/watch/", "");
        const data_id = id.split("-").pop();

        // --- tvInfo ---
        const tvInfo = {};

        // showType — plain text of first scd-item (strip icon text)
        tvInfo.showType = $(ele)
          .find("div.sc-detail div.scd-item:eq(0)")
          .text()
          .trim()
          .replace(/\s+/g, " ");

        // duration — second scd-item
        tvInfo.duration = $(ele)
          .find("div.sc-detail div.scd-item:eq(1)")
          .text()
          .trim()
          .replace(/\s+/g, " ");

        // releaseDate — third scd-item
        tvInfo.releaseDate = $(ele)
          .find("div.sc-detail div.scd-item:eq(2)")
          .text()
          .trim()
          .replace(/\s+/g, " ");

        // quality — read directly from <span class="quality">
        tvInfo.quality = $(ele)
          .find("div.sc-detail span.quality")
          .text()
          .trim();

        // episodeInfo — read from .tick-sub and .tick-dub
        const tickContainer = $(ele).find("div.sc-detail .tick");
        tvInfo.episodeInfo = {
          sub: tickContainer.find(".tick-sub").text().trim().replace(/\D/g, ""),
          dub: tickContainer.find(".tick-dub").text().trim().replace(/\D/g, ""),
        };

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
