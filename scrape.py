from lxml import html
import requests
import re

ABBREVS = {
    "I’m": "I am",
    "he’s": "he is",
    "she’s": "she is",
    "He’s": "He is",
    "She’s": "She is",
    "’re": " are",
    "it’s": "it is",
    "It’s": "It is",
    "that’s": "that is",
    "That’s": "That is",
    "there’s": "there is",
    "There’s": "There is",
    "can’t": "cannot",
    "Can’t": "Cannot",
    "won’t": "will not",
    "Won’t": "Will not",
    "n’t": " not",
    "’ve": " have",
    "’ll": " will",
    "what’s": "what is",
    "What’s": "What is",
}


def ep_properties(episode: str):
    properties = {}
    data = episode.split(maxsplit=5)
    properties["series_no"], properties["episode_no"], properties["episode_name"] = int(data[1]), int(data[3]), data[5]
    return properties


def links():
    pages = {}
    r = requests.get("https://bigbangtrans.wordpress.com/about/")
    for elem in html.fromstring(r.content).xpath('//body//div[@id = "pages-2"]//li/a'):
        pages[elem.xpath('./text()')[0].replace('\xa0', ' ')] = elem.xpath('./@href')[0]
    pages.pop('About')
    return pages


def get_www_content(episode: str, link: str):
    properties = ep_properties(episode)
    r = requests.get(link)
    if r.status_code != 200:
        print(episode)
    return (html.fromstring(r.content).xpath('//body//div[@id = "content"]//p/span'
                                             ' | //body//div[@id = "content"]//p/em/span/span'
                                             ' | //body//div[@id = "content"]//p/span/span'
                                             ' | //body//div[@id = "content"]//p'
                                             ' | //body//div[@id = "content"]//p/i'),
            properties)


def get_transcription(html_replicas):
    replicas = []
    for elem in html_replicas:
        rep = ''
        for child in elem.xpath('./em/text() | ./text()'):
            rep += child
        if rep.strip():
            replicas.append(rep.strip())
    return replicas


def parse_replica(replica: str):
    if ":" not in replica:
        return None, None
    data = replica.split(":", maxsplit=1)
    return remove_parentheses(data[0]), remove_parentheses(handle_abbrevs(data[1]))


def remove_parentheses(s: str):
    without_parentheses = re.sub(r'\(.*\)', '', s)
    return re.sub(r'\s+', ' ', without_parentheses).strip()


def handle_abbrevs(s: str):
    new = s
    for abbrev, full in ABBREVS.items():
        new = re.sub(abbrev, full, new)
    return new


def scrape_all(replicas: str = "replicas.csv", episodes: str = "episodes.csv"):
    out_rep = open(replicas, "w")
    out_epi = open(episodes, "w")
    ep_id = 0
    print("ID,Series,EpisodeNumber,EpisodeName", file=out_epi)
    print("EpisodeID,Character,Replica", file=out_rep)
    for ep, link in links().items():
        content, properties = get_www_content(ep, link)
        print(f'{ep_id},{properties["series_no"]},{properties["episode_no"]},"{properties["episode_name"]}"',
              file=out_epi)
        for rep in get_transcription(content):
            character, replica = parse_replica(rep)
            if character is None:
                continue
            print(f'{ep_id},{character},"{replica}"', file=out_rep)
        ep_id += 1
    out_epi.close()
    out_rep.close()


if __name__ == "__main__":
    scrape_all()
