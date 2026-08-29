/**
 * Dr Igic Clinic - Google Ads Script: hard spend cap + daily hygiene.
 *
 * Google's own daily budget is NOT a hard cap: Google may spend up to 2x on a given day
 * and only balances out over a month. At 10/day that means up to 20 in one day, so a
 * 50 / 5 day test can burn out in 3 days. This script enforces the cap itself.
 *
 * All amounts are in the account's own currency - this account bills in USD, so 50 here
 * means USD 50 (~EUR 46), not EUR 50.
 *
 * WHAT IT DOES (run hourly)
 *   1. Sums campaign cost since CAMPAIGN_START_DATE.
 *   2. Pauses the campaign the moment total cost >= TOTAL_BUDGET.
 *   3. Pauses keywords that burned money with zero conversions (waste control).
 *   4. Emails a short status line.
 *
 * SCHEDULE: Tools > Bulk actions > Scripts > this script > Frequency: Hourly.
 */

var CAMPAIGN_NAMES = ['DrIgic | Search | Nis'];
var CAMPAIGN_START_DATE = '20260901';   // YYYYMMDD - set to the day the campaign goes live
var TOTAL_BUDGET = 50;                   // in the ACCOUNT currency (this account bills in USD)
var WARN_AT_RATIO = 0.8;                 // email a warning at 80% spent

// Waste control: pause a keyword that spent this much with no conversions.
var KEYWORD_WASTE = 5;       // ~10% of total budget on one non-converting keyword, account currency
var ENABLE_KEYWORD_PAUSING = true;

var EMAIL_TO = '';                       // e.g. 'web.wise018@gmail.com'; empty = no email
var DRY_RUN = true;

function main() {
  var today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyyMMdd');
  var totalCost = 0;
  var lines = [];

  for (var i = 0; i < CAMPAIGN_NAMES.length; i++) {
    var campaign = findCampaign(CAMPAIGN_NAMES[i]);
    if (!campaign) continue;

    var stats = campaign.getStatsFor(CAMPAIGN_START_DATE, today);
    var cost = stats.getCost();
    totalCost += cost;

    lines.push(
      CAMPAIGN_NAMES[i] + ': ' + money(cost) + ' | ' + stats.getClicks() + ' klikova | ' +
      stats.getConversions() + ' konverzija | ' +
      (campaign.isPaused() ? 'PAUZIRANA' : 'aktivna')
    );

    if (ENABLE_KEYWORD_PAUSING) {
      pauseWastefulKeywords(campaign, CAMPAIGN_START_DATE, today, lines);
    }
  }

  var capped = totalCost >= TOTAL_BUDGET;
  if (capped) {
    for (var j = 0; j < CAMPAIGN_NAMES.length; j++) {
      var c = findCampaign(CAMPAIGN_NAMES[j]);
      if (!c || c.isPaused()) continue;
      if (DRY_RUN) {
        lines.push('[dry] would PAUSE ' + CAMPAIGN_NAMES[j] + ' - budget cap reached');
      } else {
        c.pause();
        lines.push('PAUSED ' + CAMPAIGN_NAMES[j] + ' - budget cap reached');
      }
    }
  }

  var summary =
    'Potroseno: ' + money(totalCost) + ' / ' + money(TOTAL_BUDGET) +
    ' (' + Math.round((totalCost / TOTAL_BUDGET) * 100) + '%)\n\n' + lines.join('\n');

  Logger.log(summary);

  if (EMAIL_TO && (capped || totalCost >= TOTAL_BUDGET * WARN_AT_RATIO)) {
    var subject = capped
      ? 'Google Ads: budzet potrosen, kampanja pauzirana'
      : 'Google Ads: potroseno ' + Math.round((totalCost / TOTAL_BUDGET) * 100) + '% budzeta';
    if (DRY_RUN) {
      Logger.log('[dry] would email "' + subject + '" to ' + EMAIL_TO);
    } else {
      MailApp.sendEmail(EMAIL_TO, subject, summary);
    }
  }
}

function pauseWastefulKeywords(campaign, from, to, lines) {
  var it = campaign.keywords()
    .withCondition('Status = ENABLED')
    .forDateRange(from, to)
    .withCondition('Cost > ' + KEYWORD_WASTE)
    .withCondition('Conversions = 0')
    .get();

  while (it.hasNext()) {
    var kw = it.next();
    var label = kw.getText() + ' (' + money(kw.getStatsFor(from, to).getCost()) + ', 0 konverzija)';
    if (DRY_RUN) {
      lines.push('[dry] would pause keyword ' + label);
    } else {
      kw.pause();
      lines.push('Pauzirana kljucna rec ' + label);
    }
  }
}

function findCampaign(name) {
  var it = AdsApp.campaigns().withCondition('Name = "' + name + '"').get();
  return it.hasNext() ? it.next() : null;
}

function money(value) {
  return value.toFixed(2) + ' ' + AdsApp.currentAccount().getCurrencyCode();
}
