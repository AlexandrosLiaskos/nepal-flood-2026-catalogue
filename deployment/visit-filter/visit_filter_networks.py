#!/usr/bin/env python3
"""Networks whose counting requests are not passed to the visit counter.

  python3 visit_filter_networks.py fetch NETWORKS.txt
      Download the published lists below and write NETWORKS.txt: one section per source,
      with the source address and the date of retrieval, then one IPv4 prefix per line.
  python3 visit_filter_networks.py write NETWORKS.txt NGINX.conf
      Replace the lines between '# BEGIN visit filter networks' and '# END visit filter networks'
      in NGINX.conf with an nginx geo block made from NETWORKS.txt (prefixes merged).

Sources:
  - Large clouds, from lord-alfred/ipranges (GitHub), updated daily from each provider's
    published list: Amazon Web Services, Google Cloud and Googlebot, Microsoft Azure,
    Oracle Cloud, DigitalOcean, Linode, Vultr.
  - Networks by number (ASN), from ipverse/asn-ip (GitHub), updated daily from routing data:
    Tencent Cloud, Huawei Cloud, Alibaba Cloud and the hosting networks that sent counting
    requests in the measurement of 17 November 2026 (HOSTING_ASNS below).
Only standard-library Python is used.
"""
import datetime, ipaddress, json, sys, urllib.request

CLOUDS = ["amazon", "google", "microsoft", "oracle", "digitalocean", "linode", "vultr"]
CLOUD_URL = "https://raw.githubusercontent.com/lord-alfred/ipranges/main/{}/ipv4_merged.txt"
ASN_URL = "https://raw.githubusercontent.com/ipverse/asn-ip/master/as/{}/ipv4-aggregated.txt"
CLOUD_ASNS = {"132203": "Tencent Cloud", "45090": "Tencent Cloud", "55990": "Huawei Cloud", "136907": "Huawei Cloud",
              "45102": "Alibaba Cloud", "37963": "Alibaba Cloud"}
# Hosting networks that sent counting requests in the measurement of 17 November 2026.
HOSTING_ASNS = {
    "979": "NETLAB-SDN - NetLab Global",
    "7203": "LEASEWEB-USA-SFO - Leaseweb USA, Inc.",
    "8075": "MICROSOFT-CORP-MSN-AS-BLOCK - Microsoft Corporat",
    "9009": "M247 M247 Europe SRL",
    "12876": "AS12876 Scaleway SAS",
    "12989": "BlackHOST Black HOST Ltd",
    "13189": "LIDERO Liden Data Internetwork AB",
    "14061": "DIGITALOCEAN-ASN - DigitalOcean, LLC",
    "14315": "1GSERVERS - 1GSERVERS, LLC",
    "14618": "AMAZON-AES - Amazon.com, Inc.",
    "15169": "GOOGLE - Google LLC",
    "16276": "OVH OVH SAS",
    "16509": "AMAZON-02 - Amazon.com, Inc.",
    "18186": "NEBULA-GLOBAL - Nebula Global LLC",
    "18779": "EGIHOSTING - EGIHosting",
    "20473": "AS-VULTR - The Constant Company, LLC",
    "23470": "RELIABLESITE - ReliableSite.Net LLC",
    "24940": "HETZNER-AS Hetzner Online GmbH",
    "25198": "ZetServers INTERKVM HOST SRL",
    "25697": "UPCLOUDUSA - UpCloud USA Inc",
    "25820": "IT7NET - IT7 Networks Inc",
    "26383": "ASNET - Baxet Group Inc.",
    "26666": "INTERSERVER-LAX - Interserver, Inc",
    "30058": "FDCSERVERS - FDCservers.net",
    "31898": "ORACLE-BMC-31898 - Oracle Corporation",
    "32374": "NUCLEARFALLOUT-LAX - Nuclearfallout Enterprises,",
    "32709": "1-JOINK - Joink, LLC",
    "32934": "FACEBOOK - Facebook, Inc.",
    "33425": "COREWEAVE - CoreWeave, Inc",
    "36530": "FUTURE-LAIN - IDC Cube",
    "38136": "AKARI-NETWORKS-AS-AP - Akari Networks",
    "41564": "AS41564 Orion Network Limited",
    "46997": "NATOLAB - Black Mesa Corporation",
    "49981": "WorldStream WorldStream B.V.",
    "50131": "SPARTANHOST Spartan Host Ltd",
    "51847": "NEAROUTE Nearoute Limited",
    "53667": "PONYNET - FranTech Solutions",
    "58065": "PacketExchange Orion Network Limited",
    "58461": "CT-HangZhou-IDC - No.288,Fu-chun Road",
    "61112": "AkileCloud AKILE LTD",
    "62240": "Clouvider Clouvider Limited",
    "62563": "AS-GLOBALTELEHOST - GLOBALTELEHOST Corp.",
    "63949": "AKAMAI-LINODE-AP - Akamai Connected Cloud",
    "134351": "LEASEWEB-AS-AP - Leaseweb Japan K.K.",
    "134543": "UNICOM-DongGuan-IDC - China Unicom Guangdong IP ",
    "134972": "IKUUU-AS-AP - IKUUU NETWORK LTD",
    "136557": "HOST-AS-AP - Host Universal Pty Ltd",
    "137409": "GSLNETWORKS-AS-AP - GSL Networks Pty LTD",
    "138997": "EDCL-AS-AP - Eons Data Communications Limited",
    "141766": "AGSCL-AS-AP - Agilenaas Global Service Co., Limi",
    "149042": "SITCL-AS-AP - Silicon Cloud Global (US)",
    "149485": "MONOCLOUDPTYLTD-AS-AP - MonoCloud Pty Ltd",
    "153371": "BACKWAVESLIMITED-AS-AP - BACK WAVES LIMITED",
    "197860": "NET-HARUKA Haruka Network Limited",
    "199139": "ASN-WERITECH Weritech B.V.",
    "199524": "GCORE G-Core Labs S.A.",
    "201106": "SPARTANHOST Spartan Host Ltd",
    "201217": "radishcloud RADISHCLOUD TECHNOLOGY LLC",
    "202662": "AS-Hytron Hytron Network Services Limited",
    "205544": "LEASEWEB-UK-LON-11 Leaseweb UK Limited",
    "207990": "HR-CUSTOMER HostRoyale Technologies Pvt Ltd",
    "212238": "CDNEXT Datacamp Limited",
    "212336": "BYTEVIRTLLC ByteVirt LLC",
    "213169": "Catixs-Edge Catixs Ltd",
    "213230": "HETZNER-CLOUD2-AS Hetzner Online GmbH",
    "214036": "ULTAHOST-AS Ultahost, Inc.",
    "215365": "Threatoff Tom Gewiese",
    "396982": "GOOGLE-CLOUD-PLATFORM - Google LLC",
    "398781": "OSL-188 - OCULUS NETWORKS INC",
    "401443": "WAP-AC - WAP.AC LLC",
    "401479": "DBM-ASN-KC - Database Mart LLC",
}
# Our own server and internal addresses: counting requests from them are not counted.
OWN = ["76.13.133.211/32", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8"]
# The network nkua-proxy, where the front server lives. If the front server gets a new address,
# set_real_ip_from no longer matches and requests arrive with its address: they are then counted
# as before (only the robot agents are refused), instead of all being refused.
NOT_FILTERED = ["172.19.0.0/16"]

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "visit-filter-networks/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")

def prefixes(text):
    out = []
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            n = ipaddress.ip_network(line, strict=False)
            if n.version == 4:
                out.append(n)
    return out

def commit_date(repo, branch):
    try:
        data = json.loads(get(f"https://api.github.com/repos/{repo}/commits/{branch}"))
        return data["commit"]["committer"]["date"]
    except Exception:
        return "unknown"

def fetch(path):
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    lines = [f"# Networks whose counting requests (POST) are answered with 204 and not counted.",
             f"# Retrieved {today} by visit_filter_networks.py fetch.", ""]
    lines += ["# own server and internal addresses"] + OWN + [""]
    rev = commit_date("lord-alfred/ipranges", "main")
    for c in CLOUDS:
        url = CLOUD_URL.format(c)
        nets = prefixes(get(url))
        lines += [f"# source: {url} (repository state {rev}); {len(nets)} prefixes"] + [str(n) for n in nets] + [""]
    rev = commit_date("ipverse/asn-ip", "master")
    for asn, name in list(CLOUD_ASNS.items()) + list(HOSTING_ASNS.items()):
        url = ASN_URL.format(asn)
        try:
            nets = prefixes(get(url))
        except Exception as error:
            print(f"AS{asn}: {error}", file=sys.stderr); continue
        lines += [f"# source: {url} (AS{asn} {name}; repository state {rev}); {len(nets)} prefixes"] + [str(n) for n in nets] + [""]
    open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines))

def write(networks, conf):
    nets = prefixes(open(networks, encoding="utf-8").read())
    merged = list(ipaddress.collapse_addresses(nets))
    head = [line for line in open(networks, encoding="utf-8").read().splitlines() if line.startswith("# Retrieved")]
    block = ["# BEGIN visit filter networks",
             f"# {len(merged)} merged IPv4 prefixes from {networks.rsplit('/', 1)[-1]} ({head[0][2:] if head else 'date unknown'}).",
             "# Generated by visit_filter_networks.py write; do not edit by hand.",
             "geo $visit_automated_network {",
             "    default 0;"]
    block += [f"    {n} 1;" for n in merged]
    block += [f"    {n} 0;" for n in NOT_FILTERED]
    block += ["}", "# END visit filter networks"]
    text = open(conf, encoding="utf-8").read()
    a, b = text.index("# BEGIN visit filter networks"), text.index("# END visit filter networks")
    b += len("# END visit filter networks")
    open(conf, "w", encoding="utf-8", newline="\n").write(text[:a] + "\n".join(block) + text[b:])
    print(f"{conf}: {len(merged)} prefixes")

if __name__ == "__main__":
    if sys.argv[1] == "fetch":
        fetch(sys.argv[2])
    elif sys.argv[1] == "write":
        write(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)

