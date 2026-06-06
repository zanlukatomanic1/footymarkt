import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import PostClient from "./PostClient";

export const metadata: Metadata = { title: "Post" };

export default function ForumPostPage({ params }: { params: { id: string } }) {
  return (
    <>
      <TopBar title="Post" />
      <div className="p-[22px] md:p-6 max-w-3xl">
        <PostClient id={params.id} />
      </div>
    </>
  );
}
