import { Seq } from "claustrum/collections/Seq";
import { FC } from "hono/jsx";

import { PostWithSlug } from "@/lib/types";

export const HomePage: FC<{ posts: Seq<PostWithSlug> }> = ({ posts }) => (
  <>
    <h1>Eddy Chen</h1>
    <a href="/name" class="text-half">
      (what's in a name?)
    </a>
    <p>
      I'm a software architect who's passionate about <b>computer science education</b>. This means
      that I like making things, and that I'm curious about how we can better enable other people to
      make things too.
    </p>
    <p>
      My work is guided by the belief that the ways which we teach and practice engineering has
      consequences; and that presence, comprehension, and craftspersonship in software are not
      luxuries, but necessities.
    </p>
    <h2>About me</h2>
    <p>
      I am currently a software engineer at <a href="https://asana.com">Asana</a>, in its Vancouver,
      BC office, where I also interned in Summer 2024.
    </p>
    <p>
      I received my Bachelor of Science in Computer Science from the{" "}
      <a href="https://uci.edu">University of California, Irvine</a>, where I had the privilege of
      being advised by Professor <a href="https://ics.uci.edu/~mikes">Michael Shindler</a> for my
      honors thesis. During my time at UCI, I was also heavily involved with{" "}
      <a href="https://icssc.club">ICS Student Council</a>, as well as{" "}
      <a href="https://acm-uci.org">ACM @ UCI</a> to a lesser extent.
    </p>
    <p>
      When I'm not writing code, I'm probably writing science fiction, making music, or playing
      esoteric board games. As someone who works in tech, I am also privileged to be able to
      appreciate the outdoors, good food, and travel (especially through credit card points).
    </p>
    <p>
      I also drink way too much coffee. This is partly by necessity, though I do appreciate the
      taste of good coffee without additives.
    </p>
    <h2>Blog</h2>
    <p>
      As part of my interest in creative writing, I enjoy yapping about things I like on my blog.
    </p>
    <p>Here are some recent posts:</p>
    <ul>
      {posts.length() ? (
        posts.map(post => (
          <li>
            <div>
              <a href={`/blog/${post.slug}`}>{post.data.title}</a>
              <p class="text-half">
                {post.data.description} ({post.data.date.toLocaleDateString("en-CA")})
              </p>
            </div>
          </li>
        ))
      ) : (
        <p>There are no recent posts. Feel free to bug Eddy via the contact methods below.</p>
      )}
    </ul>
    <p>
      You can find all posts in the archive <a href="/blog">here</a>. There's also an{" "}
      <a href="/rss.xml">RSS feed</a> if you're so inclined.
    </p>
    <p>If you enjoy what I write about, you'll probably also enjoy my friends' websites:</p>
    <ul>
      <li>
        <a href="https://alexanderliu.com">Alexander Liu</a>
      </li>
      <li>
        <a href="https://dantedam.com">Dante Dam</a>
      </li>
      <li>
        <a href="https://ericpedley.github.io">Eric Pedley</a>
      </li>
      <li>
        <a href="https://awesome-e.dev">Ethan Wang</a>
      </li>
    </ul>
    <h2>Get in touch</h2>
    <ul>
      <li>
        <a href="mailto:e@eddychen.ca">e [at] eddychen [d0t] ca</a>
      </li>
      <li>
        <a href="https://github.com/ecxyzzy">GitHub</a>
      </li>
    </ul>
  </>
);
