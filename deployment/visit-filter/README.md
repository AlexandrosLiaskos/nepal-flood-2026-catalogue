# Visit filter

The web server answers counting requests (POST to `/api/visit`) with 204, without passing them to the visit counter, when

- the user agent names a robot, an automation tool or an HTTP library, or is empty (`map $visit_robot_agent` in `../nginx.conf`), or
- the visitor's address belongs to a cloud or hosting network, to this server or to an internal network (`geo $visit_automated_network`).

Reading the number (GET) is not affected. The same rules classified the requests of the front server's log when the count was corrected on 17 November 2026 (see `CHANGELOG.md`).

## Visitor address

The front server (container `coms-nginx-1`, address `172.19.0.12` on the Docker network `nkua-proxy`) sends the visitor's address in `X-Forwarded-For`. `nginx.conf` trusts the header only from that address (`set_real_ip_from 172.19.0.12; real_ip_header X-Forwarded-For;`). If the front server gets another address, requests arrive with that address, which is in `172.19.0.0/16`; that network is not filtered, so visits are still counted (robot agents are still refused) until `set_real_ip_from` is updated.

## Network list

`networks.txt` holds the published lists, one section per source, with the source address and the date of retrieval:

- large clouds from [lord-alfred/ipranges](https://github.com/lord-alfred/ipranges), which is updated daily from each provider's published list: Amazon Web Services, Google Cloud and Googlebot, Microsoft Azure, Oracle Cloud, DigitalOcean, Linode, Vultr;
- networks by number (ASN) from [ipverse/asn-ip](https://github.com/ipverse/asn-ip), updated daily from routing data: Tencent Cloud, Huawei Cloud, Alibaba Cloud and the hosting networks that sent counting requests in the measurement of 17 November 2026;
- this server and the internal networks.

## Update

```sh
python3 deployment/visit-filter/visit_filter_networks.py fetch deployment/visit-filter/networks.txt
python3 deployment/visit-filter/visit_filter_networks.py write deployment/visit-filter/networks.txt deployment/nginx.conf
```

On the server, write the new file into the existing one (the container mounts the single file) and reload:

```sh
cat deployment/nginx.conf > /opt/nepal-flood-2026-catalogue/nginx.conf
docker exec nepal-flood-2026-catalogue nginx -t && docker exec nepal-flood-2026-catalogue nginx -s reload
```
